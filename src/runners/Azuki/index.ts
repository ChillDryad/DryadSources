import {
  CatalogRating,
  type Chapter,
  type ChapterData,
  type Content,
  type ContentSource,
  type DirectoryConfig,
  type DirectoryRequest,
  FilterType,
  type PagedResult,
  type RunnerInfo,
  ReadingMode,
  type Tag,
} from "@suwatte/daisuke"
import { load } from "cheerio"

const ORGANIZATION_KEY = "199e5a19-a236-49f5-81f4-43d4a541748a"

export class Target implements ContentSource {
  baseUrl = "https://www.omoi.com"
  apiUrl = "https://production.api.azuki.co"

  info: RunnerInfo = {
    id: "kusa.azuki",
    name: "Azuki",
    thumbnail: "azuki.png",
    version: 1.0,
    website: this.baseUrl,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.MIXED,
  }
  client = new NetworkClient()

  private apiHeaders() {
    const headers: Record<string, string> = {
      "azuki-organization-key": ORGANIZATION_KEY,
      Referer: `${this.baseUrl}/`,
    }
    return headers
  }

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const page = request.page || 1
    const params: Record<string, string | string[] | undefined> = { page: page.toString() }

    if (request.query) params.q = request.query
    if (request.sort?.id) params.sort = request.sort.id

    if (request.filters?.accessType) params.access_type = request.filters.accessType
    if (request.filters?.publisher) params.publisher_slug = request.filters.publisher
    if (request.filters?.genres) {
      const genres = request.filters.genres as string[]
      if (genres.length === 1) {
        params["tags[]"] = genres[0]
      } else {
        params["tags[]"] = genres
      }
    }

    const response = await this.client.get(`${this.baseUrl}/discover`, { params })
    const $ = load(response.data)

    const items = $("ol.o-series-card-list li").toArray()
    const highlights = items.map((item) => {
      const link = $(item).find("a.a-card-link").first()
      const uuid = (link.attr("data-ga-item-id") || "").replace("series-", "")
      const href = link.attr("href") || ""
      const slug = href.split("/").filter(Boolean).pop() || ""
      return {
        id: `${slug}#${uuid}`,
        title: link.text().trim(),
        cover: $(item).find("img").attr("src") || "",
      }
    })

    const hasNext = $("a[rel=next]").length > 0

    return {
      results: highlights,
      isLastPage: !hasNext,
    }
  }

  async getContent(contentId: string): Promise<Content> {
    // contentId is "slug#uuid"
    const [slug, uuid] = contentId.split("#")

    const response = await this.client.get(`${this.apiUrl}/manga/slug/${slug}/v0`, {
      headers: this.apiHeaders(),
    })
    const json = JSON.parse(response.data)

    const title = json.name || ""
    const cover = json.image?.webp?.length > 0
      ? json.image.webp.reduce((max: { url: string; width: number }, cur: { url: string; width: number }) =>
          cur.width > max.width ? cur : max
        ).url.replace(/\/\d+_/, "/2400_")
      : ""
    const summary = json.short_description || ""
    const creators = (json.creators || []).map((c: { name: string }) => c.name)
    const genres = json.tags || []
    const status = json.is_complete ? 1 : 0

    // Build description with extra info
    let description = summary
    if (json.credits) description += `\n\n${json.credits}`
    if (json.alt_titles?.length) {
      description += `\n\nAlternative Titles:`
      json.alt_titles.forEach((alt: { name: string }) => {
        description += `\n${alt.name}`
      })
    }
    if (json.release_schedule) description += `\n\n${json.release_schedule}`

    const chapters = await this.getChapters(contentId)

    return {
      title,
      cover,
      summary: description,
      creators,
      status,
      isNSFW: false,
      chapters,
      recommendedPanelMode: ReadingMode.PAGED_COMIC,
      webUrl: `${this.baseUrl}/series/${slug}`,
    }
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    const [slug, uuid] = contentId.split("#")
    if (!uuid) return []

    const response = await this.client.get(`${this.apiUrl}/mangas/${uuid}/chapters/v4`, {
      headers: this.apiHeaders(),
      params: { order: "ascending", count: "1000" },
    })
    const json = JSON.parse(response.data)

    const chapters: Chapter[] = (json.chapters || []).map((ch: {
      uuid: string
      title: string | null
      label: string
      release_date: string | null
      free_published_date: string | null
      free_unpublished_date: string | null
      is_upcoming: boolean | null
    }, i: number) => {
      const chapterLabel = `Chapter ${ch.label}`
      const fullTitle = ch.title ? `${chapterLabel} - ${ch.title}` : chapterLabel
      const upcoming = ch.is_upcoming ? `${fullTitle} - [Upcoming]` : fullTitle
      const number = parseFloat(ch.label) || i + 1
      return {
        chapterId: `${ch.uuid}#${slug}`,
        title: upcoming,
        number,
        index: i,
        language: "EN_US",
        date: ch.release_date ? new Date(ch.release_date) : new Date(0),
      }
    })

    return chapters.reverse()
  }

  async getChapterData(
    _contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    // chapterId is "uuid#slug"
    const [chapterUuid] = chapterId.split("#")

    const response = await this.client.get(`${this.apiUrl}/chapters/${chapterUuid}/pages/v1`, {
      headers: this.apiHeaders(),
    })
    const json = JSON.parse(response.data)

    const pages = (json.data?.pages || []).map((page: {
      image: { webp: { url: string; width: number }[] }
    }) => {
      const highRes = page.image.webp.reduce((max: { url: string; width: number }, cur: { url: string; width: number }) =>
        cur.width > max.width ? cur : max
      )
      const highResUrl = highRes.url.replace(/\/\d+_/, "/2400_")
      return { url: `${highResUrl}?drm=1` }
    })

    // Note: Azuki uses DRM (XOR with 174) on images - the runner can't decrypt,
    // but the URLs are provided for reference
    return { pages }
  }

  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {
      filters: [
        {
          id: "accessType",
          title: "Access Type",
          type: FilterType.SELECT,
          options: [
            { id: "", title: "Any" },
            { id: "premium_including_partial", title: "Partial Premium" },
            { id: "fully_premium", title: "Premium" },
            { id: "purchasable", title: "Ebook" },
          ],
        },
        {
          id: "publisher",
          title: "Publisher",
          type: FilterType.SELECT,
          options: AZUKI_PUBLISHERS,
        },
        {
          id: "genres",
          title: "Genres",
          type: FilterType.MULTISELECT,
          options: AZUKI_GENRES,
        },
      ],
      sort: {
        options: [
          { id: "popular", title: "Popular" },
          { id: "recent_series", title: "Recent Series" },
          { id: "alphabetical", title: "Alphabetical" },
        ],
        canChangeOrder: false,
        default: { id: "popular" },
      },
    }
  }
}

const AZUKI_GENRES: Tag[] = [
  { id: "action", title: "Action" },
  { id: "adventure", title: "Adventure" },
  { id: "comedy", title: "Comedy" },
  { id: "drama", title: "Drama" },
  { id: "ecchi", title: "Ecchi" },
  { id: "fantasy", title: "Fantasy" },
  { id: "harem", title: "Harem" },
  { id: "historical", title: "Historical" },
  { id: "horror", title: "Horror" },
  { id: "josei", title: "Josei" },
  { id: "martial-arts", title: "Martial Arts" },
  { id: "mature", title: "Mature" },
  { id: "mecha", title: "Mecha" },
  { id: "mystery", title: "Mystery" },
  { id: "psychological", title: "Psychological" },
  { id: "romance", title: "Romance" },
  { id: "school-life", title: "School Life" },
  { id: "scifi", title: "Sci-Fi" },
  { id: "seinen", title: "Seinen" },
  { id: "shoujo", title: "Shojo" },
  { id: "shounen", title: "Shonen" },
  { id: "slice-of-life", title: "Slice of Life" },
  { id: "sports", title: "Sports" },
  { id: "supernatural", title: "Supernatural" },
  { id: "tragedy", title: "Tragedy" },
]

const AZUKI_PUBLISHERS: Tag[] = [
  { id: "", title: "Any" },
  { id: "ablaze", title: "ABLAZE" },
  { id: "cmoa-comics", title: "C'moA Comics" },
  { id: "cllenn", title: "CLLENN" },
  { id: "coamix", title: "Coamix Inc." },
  { id: "comic-room-co-ltd", title: "COMIC ROOM Co., Ltd." },
  { id: "compass-inc", title: "COMPASS Inc." },
  { id: "cork", title: "CORK" },
  { id: "funguild-mangaplaza", title: "FUNGUILD (MangaPlaza)" },
  { id: "futabasha-publishers-ltd", title: "Futabasha Publishers Ltd." },
  { id: "glacier-bay-books", title: "Glacier Bay Books" },
  { id: "j-novel-club", title: "J-Novel Club" },
  { id: "kadokawa", title: "KADOKAWA" },
  { id: "kaiten-books", title: "Kaiten Books" },
  { id: "kodansha", title: "Kodansha" },
  { id: "libre-inc", title: "Libre Inc." },
  { id: "manga-up", title: "Manga Up!" },
  { id: "azuki", title: "Omoi" },
  { id: "one-peace-books", title: "One Peace Books" },
  { id: "sozo-comics", title: "SOZO Comics" },
  { id: "yuzu-comics", title: "YUZU Comics" },
]