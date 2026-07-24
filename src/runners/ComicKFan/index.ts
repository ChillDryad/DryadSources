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

export class Target implements ContentSource {
  baseUrl = "https://comickfan.com"

  info: RunnerInfo = {
    id: "kusa.comickfan",
    name: "ComicKFan",
    thumbnail: "comickfan.png",
    version: 1.0,
    website: this.baseUrl,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.MIXED,
  }
  client = new NetworkClient()

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const page = request.page || 1
    const params: Record<string, string | string[] | undefined> = {
      page: page.toString(),
    }

    if (request.query) params.name = request.query

    // Genres from multiple filter groups
    const genres: string[] = []
    if (request.filters?.formatGenres) {
      genres.push(...(request.filters.formatGenres as string[]))
    }
    if (request.filters?.contentGenres) {
      genres.push(...(request.filters.contentGenres as string[]))
    }
    if (request.filters?.themeGenres) {
      genres.push(...(request.filters.themeGenres as string[]))
    }
    if (request.filters?.genreGenres) {
      genres.push(...(request.filters.genreGenres as string[]))
    }
    if (genres.length > 0) params.genres = genres.join("_")

    if (request.filters?.status) params.status = request.filters.status
    if (request.filters?.type) params.type = request.filters.type
    if (request.sort?.id) params.sort = request.sort.id

    const response = await this.client.get(`${this.baseUrl}/advanced-search`, { params })
    const $ = load(response.data)

    const items = $("div:has(> form) + div.grid > a").toArray()
    const highlights = items.map((item) => {
      const href = $(item).attr("href") || ""
      const id = href.replace(`${this.baseUrl}/manga/`, "").replace(/\/$/, "")
      const img = $(item).find("img").first()
      return {
        id,
        title: img.attr("alt") || "",
        cover: img.attr("src") || "",
      }
    })

    const hasNext = $("a:has(img[alt=Next])").length > 0

    return {
      results: highlights,
      isLastPage: !hasNext,
    }
  }

  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.get(`${this.baseUrl}/manga/${contentId}`)
    const $ = load(response.data)

    const infoRoot = $("div[class=bg-card-section]")
    const title = $("h1").first().text().trim()
    const cover = infoRoot.find("div.thumb-cover img").attr("src") || ""
    const description = $("div.comic-content.desk").text().trim()

    // Extract author
    const author = this.getValue($, infoRoot, "Author")
    const artist = this.getValue($, infoRoot, "Artist")
    const genres = infoRoot.find("div.font-medium:contains(Genres) + div a")
      .map((_i, el) => $(el).text().trim())
      .get()

    const statusText = (this.getValue($, infoRoot, "Status") || "").toLowerCase()
    let status = 0
    if (statusText === "ongoing") status = 0
    else if (statusText === "completed") status = 1
    else if (statusText === "hiatus") status = 2
    else if (statusText === "cancelled") status = 3

    const chapters = await this.getChapters(contentId)

    return {
      title,
      cover,
      summary: description,
      creators: [author, artist].filter(Boolean),
      status,
      isNSFW: false,
      chapters,
      recommendedPanelMode: ReadingMode.WEBTOON,
      webUrl: `${this.baseUrl}/manga/${contentId}`,
    }
  }

  private getValue($load: any, root: any, label: string): string | null {
    let result: string | null = null
    root.find("div.flex-row.gap-4").each((_i: number, el: any) => {
      const labelText = $load(el).find("> div.text-sm").first().text()
      if (labelText === label) {
        const valEl = $load(el).find("> div.text-sm:nth-child(2):last-child")
        const text = valEl.text().trim()
        if (text && text !== "" && text !== "-" && text !== "_") {
          result = text
        }
        return false
      }
    })
    return result
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    const response = await this.client.get(`${this.baseUrl}/api/comics/${contentId}/chapter-list`, {
      params: { translation_group_id: "" },
    })
    const json = JSON.parse(response.data)

    const chapters: Chapter[] = (json.data || []).map((ch: {
      hash_id: string
      chapter: string
      title: string | null
      group_names: string[]
      published_at: string | null
      created_at: string | null
    }, i: number) => {
      const number = parseFloat(ch.chapter) || i + 1
      const title = `Chapter ${ch.chapter}`
      const scanlator = ch.group_names.join(", ")
      const dateStr = ch.created_at || ch.published_at
      return {
        chapterId: `/manga/${contentId}/chapter-${ch.chapter}-${ch.hash_id}`,
        title,
        number,
        index: i,
        language: "EN_US",
        date: dateStr ? new Date(dateStr) : new Date(0),
      }
    })

    return chapters
  }

  async getChapterData(
    _contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const response = await this.client.get(`${this.baseUrl}${chapterId}`)
    const $ = load(response.data)

    const pages = $("div.w-full > img[loading=lazy]").toArray().map((el, i) => ({
      url: $(el).attr("src") || "",
    }))

    return { pages }
  }

  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {
      filters: [
        {
          id: "formatGenres",
          title: "Format",
          type: FilterType.MULTISELECT,
          options: FORMAT_GENRES,
        },
        {
          id: "contentGenres",
          title: "Content",
          type: FilterType.MULTISELECT,
          options: CONTENT_GENRES,
        },
        {
          id: "themeGenres",
          title: "Theme",
          type: FilterType.MULTISELECT,
          options: THEME_GENRES,
        },
        {
          id: "genreGenres",
          title: "Genre",
          type: FilterType.MULTISELECT,
          options: GENRE_GENRES,
        },
        {
          id: "status",
          title: "Status",
          type: FilterType.SELECT,
          options: [
            { id: "", title: "All" },
            { id: "1", title: "Ongoing" },
            { id: "2", title: "Completed" },
            { id: "3", title: "Cancelled" },
            { id: "4", title: "Hiatus" },
          ],
        },
        {
          id: "type",
          title: "Type",
          type: FilterType.SELECT,
          options: [
            { id: "", title: "All" },
            { id: "jp", title: "Manga" },
            { id: "kr", title: "Manhwa" },
            { id: "cn", title: "Manhua" },
          ],
        },
      ],
      sort: {
        options: [
          { id: "", title: "All" },
          { id: "latest", title: "Last Updated" },
          { id: "rating", title: "Rating" },
          { id: "bookmark", title: "Bookmark Count" },
          { id: "name_asc", title: "Name (A-Z)" },
          { id: "name_desc", title: "Name (Z-A)" },
        ],
        canChangeOrder: false,
        default: { id: "" },
      },
    }
  }
}

const FORMAT_GENRES: Tag[] = [
  { id: "award-winning", title: "Award Winning" },
  { id: "long-strip", title: "Long Strip" },
  { id: "official-colored", title: "Official Colored" },
  { id: "fan-colored", title: "Fan Colored" },
  { id: "anthology", title: "Anthology" },
  { id: "full-color", title: "Full Color" },
  { id: "4-koma", title: "4-Koma" },
  { id: "user-created", title: "User Created" },
  { id: "adaptation", title: "Adaptation" },
  { id: "web-comic", title: "Web Comic" },
  { id: "oneshot", title: "Oneshot" },
  { id: "doujinshi", title: "Doujinshi" },
]

const CONTENT_GENRES: Tag[] = [
  { id: "sexual-violence", title: "Sexual Violence" },
  { id: "gore", title: "Gore" },
  { id: "smut", title: "Smut" },
  { id: "ecchi", title: "Ecchi" },
]

const THEME_GENRES: Tag[] = [
  { id: "ninja", title: "Ninja" },
  { id: "virtual-reality", title: "Virtual Reality" },
  { id: "police", title: "Police" },
  { id: "magic", title: "Magic" },
  { id: "villainess", title: "Villainess" },
  { id: "traditional-games", title: "Traditional Games" },
  { id: "reincarnation", title: "Reincarnation" },
  { id: "zombies", title: "Zombies" },
  { id: "loli", title: "Loli" },
  { id: "time-travel", title: "Time Travel" },
  { id: "mafia", title: "Mafia" },
  { id: "music", title: "Music" },
  { id: "monsters", title: "Monsters" },
  { id: "post-apocalyptic", title: "Post-Apocalyptic" },
  { id: "office-workers", title: "Office Workers" },
  { id: "monster-girls", title: "Monster Girls" },
  { id: "cooking", title: "Cooking" },
  { id: "video-games", title: "Video Games" },
  { id: "reverse-harem", title: "Reverse Harem" },
  { id: "demons", title: "Demons" },
  { id: "harem", title: "Harem" },
  { id: "vampires", title: "Vampires" },
  { id: "shota", title: "Shota" },
  { id: "incest", title: "Incest" },
  { id: "delinquents", title: "Delinquents" },
  { id: "gyaru", title: "Gyaru" },
  { id: "animals", title: "Animals" },
  { id: "military", title: "Military" },
  { id: "aliens", title: "Aliens" },
  { id: "survival", title: "Survival" },
  { id: "ghosts", title: "Ghosts" },
  { id: "crossdressing", title: "Crossdressing" },
  { id: "school-life", title: "School Life" },
  { id: "martial-arts", title: "Martial Arts" },
  { id: "samurai", title: "Samurai" },
  { id: "genderswap", title: "Genderswap" },
  { id: "supernatural", title: "Supernatural" },
]

const GENRE_GENRES: Tag[] = [
  { id: "fantasy", title: "Fantasy" },
  { id: "wuxia", title: "Wuxia" },
  { id: "drama", title: "Drama" },
  { id: "sports", title: "Sports" },
  { id: "psychological", title: "Psychological" },
  { id: "medical", title: "Medical" },
  { id: "superhero", title: "Superhero" },
  { id: "gender-bender", title: "Gender Bender" },
  { id: "romance", title: "Romance" },
  { id: "shoujo-ai", title: "Shoujo Ai" },
  { id: "tragedy", title: "Tragedy" },
  { id: "slice-of-life", title: "Slice of Life" },
  { id: "shounen-ai", title: "Shounen Ai" },
  { id: "isekai", title: "Isekai" },
  { id: "mecha", title: "Mecha" },
  { id: "adult", title: "Adult" },
  { id: "magical-girls", title: "Magical Girls" },
  { id: "philosophical", title: "Philosophical" },
  { id: "sci-fi", title: "Sci-Fi" },
  { id: "thriller", title: "Thriller" },
  { id: "historical", title: "Historical" },
  { id: "yaoi", title: "Yaoi" },
  { id: "mature", title: "Mature" },
  { id: "mystery", title: "Mystery" },
  { id: "adventure", title: "Adventure" },
  { id: "yuri", title: "Yuri" },
  { id: "comedy", title: "Comedy" },
  { id: "horror", title: "Horror" },
  { id: "others", title: "Others" },
  { id: "crime", title: "Crime" },
  { id: "action", title: "Action" },
]