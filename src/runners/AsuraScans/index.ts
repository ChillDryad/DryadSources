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
  type PageSection,
  type Property,
  type RunnerInfo,
  ReadingMode,
  type Tag,
} from "@suwatte/daisuke"
import { load } from "cheerio"

const PER_PAGE = 20

export class Target implements ContentSource {
  baseUrl = "https://asurascans.com"
  apiUrl = "https://api.asurascans.com/api"

  info: RunnerInfo = {
    id: "kusa.asurascans",
    name: "AsuraScans",
    thumbnail: "asura.png",
    version: 1.0,
    website: this.baseUrl,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.MIXED,
  }
  client = new NetworkClient()

  async getSectionsForPage(): Promise<PageSection[]> {
    return [
      {
        id: "popular",
        title: "Popular",
        style: 1,
      },
      {
        id: "latest",
        title: "Latest Updates",
        style: 1,
      },
      {
        id: "newest",
        title: "Newest",
        style: 1,
      },
    ]
  }

  async resolvePageSection(
    _link: unknown,
    section: string,
  ): Promise<{ items: unknown[] }> {
    const sortMap: Record<string, string> = {
      popular: "popular",
      latest: "latest",
      newest: "update",
    }
    const sort = sortMap[section] ?? "latest"
    const response = await this.client.get(`${this.apiUrl}/series`, {
      params: { sort, order: "desc", limit: PER_PAGE, offset: 0 },
    })
    const json = JSON.parse(response.data)
    const items = (json.data ?? []).map((item: Record<string, unknown>) => ({
      id: item.slug as string,
      title: item.title as string,
      cover: item.coverUrl as string,
    }))
    return { items }
  }

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const params: Record<string, string | number | undefined> = {
      offset: ((request.page - 1) * PER_PAGE).toString(),
      limit: PER_PAGE,
    }
    if (request.query) params.search = request.query
    if (request.sort?.id) {
      params.sort = request.sort.id
      params.order = "desc"
    } else {
      params.sort = "latest"
      params.order = "desc"
    }
    if (request.filters?.status) params.status = request.filters.status
    if (request.filters?.type) params.type = request.filters.type
    if (request.filters?.genres) {
      params.genres = (request.filters.genres as string[]).join(",")
    }

    const response = await this.client.get(`${this.apiUrl}/series`, { params })
    const json = JSON.parse(response.data)
    const highlights = (json.data ?? []).map((item: Record<string, unknown>) => ({
      id: item.slug as string,
      title: item.title as string,
      cover: item.coverUrl as string,
    }))
    return {
      results: highlights,
      isLastPage: !(json.meta?.hasMore ?? false),
    }
  }

  async getContent(contentId: string): Promise<Content> {
    // Fetch the series page to extract Astro props
    const response = await this.client.get(`${this.baseUrl}/comics/${contentId}`)
    const $ = load(response.data)

    // Extract title and thumbnail from the page
    const title = $("h1").first().text().trim()
    const cover = $(".summary_image img, .thumb-cover img").attr("src") || ""

    // Extract description
    const summary = $(".description-summary .summary__content, .description-summary").text().trim()

    // Extract genres
    const genres = $(".genres-content a")
      .map((_i, el) => $(el).text().trim())
      .get()

    // Extract author
    const author = $(".author-content a").map((_i, el) => $(el).text().trim()).get().join(", ")

    // Extract status
    const statusText = $(".summary-content, .summary-heading:contains(Status) + div").text().trim()
    let status = 0 // ONGOING
    if (statusText.toLowerCase().includes("completed")) status = 1
    else if (statusText.toLowerCase().includes("hiatus")) status = 2
    else if (statusText.toLowerCase().includes("dropped") || statusText.toLowerCase().includes("axed")) status = 3

    const chapters = await this.getChapters(contentId)

    const properties: Property[] = []
    if (genres.length > 0) {
      properties.push({
        id: "genres",
        title: "Genres",
        tags: genres.map((g, i) => ({
          id: i.toString(),
          title: g,
          nsfw: false,
          noninteractive: false,
        })),
      })
    }

    return {
      title,
      cover,
      summary,
      creators: author ? [author] : [],
      status,
      isNSFW: false,
      chapters,
      properties,
      recommendedPanelMode: ReadingMode.WEBTOON,
      webUrl: `${this.baseUrl}/comics/${contentId}`,
    }
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    // Fetch series page to get chapters from Astro props
    const response = await this.client.get(`${this.baseUrl}/comics/${contentId}`)
    const $ = load(response.data)

    // Try to extract chapters from the page's Astro props
    const chapterProps = $("[props*=chapters]").attr("props")
    let chapterList: Array<{
      number: number
      title: string | null
      created_at: string
      is_locked: boolean
    }> = []

    if (chapterProps) {
      try {
        const parsed = JSON.parse(chapterProps)
        // Unwrap Astro wrapper
        const unwrapped = Array.isArray(parsed) && parsed.length >= 2 ? parsed[1] : parsed
        const chaptersData = unwrapped?.chapters ?? unwrapped
        if (Array.isArray(chaptersData)) {
          chapterList = chaptersData
        }
      } catch {
        // Fall back to HTML parsing
      }
    }

    // Fall back to HTML parsing if Astro props didn't work
    if (chapterList.length === 0) {
      const chapterElements = $("li.wp-manga-chapter").toArray()
      for (let i = 0; i < chapterElements.length; i++) {
        const el = chapterElements[i]
        const link = $(el).find("a").first()
        const href = link.attr("href") || ""
        const chapterUrl = href.replace(this.baseUrl, "")
        const name = link.text().trim()
        const numberMatch = name.match(/(\d+(\.\d+)?)/)
        const number = numberMatch ? parseFloat(numberMatch[1]) : i
        const dateText = $(el).find(".chapter-release-date").text().trim()
        chapterList.push({
          number,
          title: name,
          created_at: dateText,
          is_locked: false,
        })
        // Store chapter URL in title
        chapterList[chapterList.length - 1].title = chapterUrl
      }
    }

    const chapters: Chapter[] = chapterList.map((ch, i) => {
      const numberStr = ch.number.toString().replace(/\.0$/, "")
      return {
        chapterId: `/series/${contentId}/chapter/${numberStr}`,
        title: ch.is_locked ? `🔒 Chapter ${numberStr}${ch.title ? ` - ${ch.title}` : ""}` : `Chapter ${numberStr}${ch.title ? ` - ${ch.title}` : ""}`,
        number: ch.number,
        index: i,
        language: "EN_US",
        date: ch.created_at ? new Date(ch.created_at) : new Date(0),
      }
    })

    return chapters
  }

  async getChapterData(
    contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const url = `${this.baseUrl}/comics/${contentId}/chapter/${chapterId.replace(/^\/series\/[^/]+\/chapter\//, "")}`
    const response = await this.client.get(url)
    const $ = load(response.data)

    // Try Astro props for pages first
    const pageProps = $("[props*=pages]").attr("props")
    if (pageProps) {
      try {
        const parsed = JSON.parse(pageProps)
        const unwrapped = Array.isArray(parsed) && parsed.length >= 2 ? parsed[1] : parsed
        const pages = unwrapped?.pages ?? []
        if (Array.isArray(pages) && pages.length > 0) {
          return {
            pages: pages.map((p: { url: string }) => ({ url: p.url })),
          }
        }
      } catch {
        // Fall through to HTML
      }
    }

    // Fall back to HTML
    const pageElements = $("div.page-break img, .reading-content img").toArray()
    const pages = pageElements
      .map((el) => {
        const url =
          $(el).attr("data-src")?.trim() ||
          $(el).attr("src")?.trim() ||
          undefined
        return url ? { url } : null
      })
      .filter((p): p is { url: string } => p !== null)

    return { pages }
  }

  async getDirectoryConfig(): Promise<DirectoryConfig> {
    // Fetch genres from the browse page
    let genres: Tag[] = []
    try {
      const response = await this.client.get(`${this.baseUrl}/browse`)
      const $ = load(response.data)
      const propsEl = $("[props*=availableGenres]").attr("props")
      if (propsEl) {
        const parsed = JSON.parse(propsEl)
        const unwrapped = Array.isArray(parsed) && parsed.length >= 2 ? parsed[1] : parsed
        const availableGenres = unwrapped?.availableGenres ?? []
        genres = availableGenres.map((g: { name: string; slug: string }) => ({
          id: g.slug,
          title: g.name,
        }))
      }
    } catch {
      // Ignore errors
    }

    return {
      filters: [
        ...(genres.length > 0
          ? [{
              id: "genres",
              title: "Genres",
              type: FilterType.MULTISELECT,
              options: genres,
            }]
          : []),
        {
          id: "status",
          title: "Status",
          type: FilterType.SELECT,
          options: [
            { id: "", title: "All" },
            { id: "ongoing", title: "Ongoing" },
            { id: "completed", title: "Completed" },
            { id: "hiatus", title: "Hiatus" },
            { id: "dropped", title: "Dropped" },
            { id: "axed", title: "Axed" },
          ],
        },
        {
          id: "type",
          title: "Type",
          type: FilterType.SELECT,
          options: [
            { id: "", title: "All" },
            { id: "manhwa", title: "Manhwa" },
            { id: "manhua", title: "Manhua" },
            { id: "manga", title: "Mangatoon" },
          ],
        },
      ],
      sort: {
        options: [
          { id: "latest", title: "Latest Update" },
          { id: "popular", title: "Popular" },
          { id: "rating", title: "Rating" },
          { id: "title", title: "A-Z" },
          { id: "update", title: "Newest" },
        ],
        canChangeOrder: true,
        default: { id: "latest" },
      },
    }
  }
}