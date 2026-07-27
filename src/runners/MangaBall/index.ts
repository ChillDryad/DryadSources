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

// ---- Types ----

interface ChapterListResponse {
  chapters: Array<{
    number: number | string
    translations: Array<{
      id: number | string
      language: string
      volume: number | string | null
      name: string | null
      date: string | null
      group: { name: string; id: number | string } | null
    }>
  }>
}

interface SmartSearchResponse {
  data?: Array<{
    id: number | string
    slug: string
    title: string
    cover?: string
    thumbnail?: string
  }>
}

interface AdvancedSearchResponse {
  data?: Array<{
    id: number | string
    slug: string
    title: string
    cover?: string
    thumbnail?: string
  }>
  meta?: {
    total?: number
    per_page?: number
    current_page?: number
    last_page?: number | null
    hasMore?: boolean
  }
}

// ---- Constants ----

const PER_PAGE = 20

const SORT_OPTIONS = [
  { id: "relevance", title: "Relevance" },
  { id: "latest-updates", title: "Latest Updates" },
  { id: "newest", title: "Newest Added" },
  { id: "rating", title: "Rating" },
  { id: "most-viewed", title: "Most Viewed" },
  { id: "alphabetical", title: "A-Z" },
]

const STATUS_OPTIONS = [
  { id: "", title: "All" },
  { id: "ongoing", title: "Ongoing" },
  { id: "completed", title: "Completed" },
  { id: "hiatus", title: "Hiatus" },
  { id: "cancelled", title: "Cancelled" },
]

const TYPE_OPTIONS = [
  { id: "", title: "All" },
  { id: "manga", title: "Manga" },
  { id: "manhwa", title: "Manhwa" },
  { id: "manhua", title: "Manhua" },
  { id: "webtoon", title: "Webtoon" },
  { id: "oneshot", title: "Oneshot" },
]

// Common genre tags available on MangaBall
const GENRE_TAGS: Tag[] = [
  { id: "action", title: "Action" },
  { id: "adventure", title: "Adventure" },
  { id: "comedy", title: "Comedy" },
  { id: "drama", title: "Drama" },
  { id: "fantasy", title: "Fantasy" },
  { id: "horror", title: "Horror" },
  { id: "mystery", title: "Mystery" },
  { id: "romance", title: "Romance" },
  { id: "sci-fi", title: "Sci-Fi" },
  { id: "slice-of-life", title: "Slice of Life" },
  { id: "sports", title: "Sports" },
  { id: "supernatural", title: "Supernatural" },
  { id: "thriller", title: "Thriller" },
  { id: "psychological", title: "Psychological" },
  { id: "historical", title: "Historical" },
  { id: "mecha", title: "Mecha" },
  { id: "school-life", title: "School Life" },
  { id: "shounen", title: "Shounen" },
  { id: "shoujo", title: "Shoujo" },
  { id: "seinen", title: "Seinen" },
  { id: "josei", title: "Josei" },
  { id: "isekai", title: "Isekai" },
  { id: "martial-arts", title: "Martial Arts" },
  { id: "tragedy", title: "Tragedy" },
  { id: "yaoi", title: "Yaoi" },
  { id: "yuri", title: "Yuri" },
  { id: "ecchi", title: "Ecchi" },
  { id: "smut", title: "Smut" },
  { id: "harem", title: "Harem" },
  { id: "reverse-harem", title: "Reverse Harem" },
  { id: "vampires", title: "Vampires" },
  { id: "zombies", title: "Zombies" },
  { id: "demons", title: "Demons" },
  { id: "magic", title: "Magic" },
  { id: "cooking", title: "Cooking" },
  { id: "music", title: "Music" },
  { id: "office-workers", title: "Office Workers" },
  { id: "military", title: "Military" },
  { id: "survival", title: "Survival" },
  { id: "reincarnation", title: "Reincarnation" },
  { id: "time-travel", title: "Time Travel" },
  { id: "video-games", title: "Video Games" },
  { id: "virtual-reality", title: "Virtual Reality" },
  { id: "monsters", title: "Monsters" },
  { id: "ghosts", title: "Ghosts" },
  { id: "post-apocalyptic", title: "Post-Apocalyptic" },
  { id: "samurai", title: "Samurai" },
  { id: "ninja", title: "Ninja" },
  { id: "police", title: "Police" },
  { id: "mafia", title: "Mafia" },
  { id: "delinquents", title: "Delinquents" },
  { id: "gyaru", title: "Gyaru" },
  { id: "crossdressing", title: "Crossdressing" },
  { id: "genderswap", title: "Genderswap" },
  { id: "anthology", title: "Anthology" },
  { id: "award-winning", title: "Award Winning" },
  { id: "long-strip", title: "Long Strip" },
  { id: "full-color", title: "Full Color" },
  { id: "4-koma", title: "4-Koma" },
  { id: "web-comic", title: "Web Comic" },
  { id: "adaptation", title: "Adaptation" },
  { id: "doujinshi", title: "Doujinshi" },
  { id: "oneshot", title: "Oneshot" },
]

// ---- Runner ----

export class Target implements ContentSource {
  baseUrl = "https://mangaball.net"
  apiUrl = "https://mangaball.net/api/v1"

  info: RunnerInfo = {
    id: "kusa.mangaball",
    name: "MangaBall",
    version: 1.0,
    website: this.baseUrl,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.MIXED,
  }
  client = new NetworkClient()

  // Cached CSRF token
  private csrfToken: string | null = null

  // ---- CSRF Token Management ----

  /**
   * Fetches the CSRF token from the homepage meta tag.
   * The token is cached and reused for subsequent API requests.
   */
  private async fetchCsrfToken(): Promise<string> {
    const response = await this.client.get(this.baseUrl)
    const $ = load(response.data)
    const token = $('meta[name="csrf-token"]').attr("content") || ""
    this.csrfToken = token
    return token
  }

  /**
   * Returns the cached CSRF token, fetching it if necessary.
   */
  private async getCsrfToken(): Promise<string> {
    if (this.csrfToken) return this.csrfToken
    return this.fetchCsrfToken()
  }

  /**
   * Makes a POST request to an API endpoint with the CSRF token.
   * If the request returns 403, the token is re-fetched and the request is retried.
   */
  private async apiPost<T = any>(
    endpoint: string,
    formData: Record<string, string | number | undefined>,
  ): Promise<T> {
    const url = `${this.apiUrl}/${endpoint.replace(/^\//, "")}`
    const token = await this.getCsrfToken()

    const makeRequest = async (csrf: string) => {
      const formBody: Record<string, any> = {}
      for (const [key, value] of Object.entries(formData)) {
        if (value !== undefined) formBody[key] = value
      }
      return this.client.post(url, {
        headers: {
          "X-CSRF-TOKEN": csrf,
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: formBody,
        validateStatus: (s: number) => s < 500,
      })
    }

    let response = await makeRequest(token)

    // Retry on 403 — token may have expired
    if (response.status === 403) {
      const newToken = await this.fetchCsrfToken()
      response = await makeRequest(newToken)
    }

    return JSON.parse(response.data) as T
  }

  // ---- NSFW Cookie ----

  /**
   * Sets the show18PlusContent cookie based on NSFW preference.
   * MangaBall requires this cookie to display adult content in listings.
   */
  private async ensureNsfwCookie(): Promise<void> {
    await this.client.get(this.baseUrl, {
      cookies: [{ name: "show18PlusContent", value: "1" }],
    })
  }

  // ---- Helper: Extract title_id from slug ----

  /**
   * Extracts the title ID from a slug.
   * MangaBall slugs are in the format: `some-manga-title-12345`
   * where `12345` is the numeric title ID.
   */
  private extractTitleId(slug: string): string {
    const parts = slug.split("-")
    return parts[parts.length - 1] || slug
  }

  // ---- Page Sections ----

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
      popular: "most-viewed",
      latest: "latest-updates",
      newest: "newest",
    }
    const sort = sortMap[section] ?? "latest-updates"

    await this.ensureNsfwCookie()

    const result = await this.apiPost<AdvancedSearchResponse>(
      "title/search-advanced/",
      {
        search_input: "",
        "filters[sort]": sort,
        "filters[page]": 1,
      },
    )

    const items = (result.data ?? []).map((item) => ({
      id: item.slug,
      title: item.title,
      cover: item.cover || item.thumbnail || "",
    }))

    return { items }
  }

  // ---- Directory ----

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    await this.ensureNsfwCookie()

    const page = request.page || 1
    const formData: Record<string, string | number | undefined> = {
      search_input: request.query || "",
      "filters[sort]": request.sort?.id || "relevance",
      "filters[page]": page,
    }

    // Apply filters
    if (request.filters?.status) {
      formData["filters[status]"] = request.filters.status as string
    }
    if (request.filters?.type) {
      formData["filters[type]"] = request.filters.type as string
    }
    if (request.filters?.genres) {
      const genres = request.filters.genres as string[]
      if (Array.isArray(genres) && genres.length > 0) {
        formData["filters[genres]"] = genres.join(",")
      }
    }

    // If only a query is provided (no filters/sort), use smart search for quick results
    if (request.query && !request.filters?.status && !request.filters?.type && !request.filters?.genres && !request.sort?.id) {
      const smartResult = await this.apiPost<SmartSearchResponse>(
        "smart-search/search/",
        {
          search_input: request.query,
        },
      )

      const highlights = (smartResult.data ?? []).map((item) => ({
        id: item.slug,
        title: item.title,
        cover: item.cover || item.thumbnail || "",
      }))

      return {
        results: highlights,
        isLastPage: true,
      }
    }

    // Advanced search with filters
    const result = await this.apiPost<AdvancedSearchResponse>(
      "title/search-advanced/",
      formData,
    )

    const highlights = (result.data ?? []).map((item) => ({
      id: item.slug,
      title: item.title,
      cover: item.cover || item.thumbnail || "",
    }))

    const meta = result.meta
    const isLastPage =
      meta?.last_page != null
        ? page >= meta.last_page
        : !(meta?.hasMore ?? false) || highlights.length < PER_PAGE

    return {
      results: highlights,
      isLastPage,
      totalResultCount: meta?.total,
    }
  }

  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {
      filters: [
        {
          id: "genres",
          title: "Genres",
          type: FilterType.MULTISELECT,
          options: GENRE_TAGS,
        },
        {
          id: "status",
          title: "Status",
          type: FilterType.SELECT,
          options: STATUS_OPTIONS,
        },
        {
          id: "type",
          title: "Type",
          type: FilterType.SELECT,
          options: TYPE_OPTIONS,
        },
      ],
      sort: {
        options: SORT_OPTIONS,
        canChangeOrder: true,
        default: { id: "relevance" },
      },
    }
  }

  // ---- Content Details ----

  async getContent(contentId: string): Promise<Content> {
    await this.ensureNsfwCookie()

    // contentId is the slug, e.g. "some-manga-title-12345"
    const response = await this.client.get(`${this.baseUrl}/title-detail/${contentId}/`)
    const $ = load(response.data)

    // Title
    const title = $("h1").first().text().trim() || $("title").text().trim()

    // Cover image
    const cover =
      $(".manga-cover img, .cover img, .summary_image img, img[alt*='" + title + "']").attr("src") ||
      $("meta[property='og:image']").attr("content") ||
      ""

    // Description / Summary
    const summary =
      $(".manga-summary, .description, .summary__content, .synopsis, .manga-detail .summary")
        .text()
        .trim() ||
      $("meta[property='og:description']").attr("content") ||
      ""

    // Genres
    const genres =
      $(".genres a, .manga-genres a, .tags a, .genre-list a")
        .map((_i, el) => $(el).text().trim())
        .get()
        .filter((g: string) => g.length > 0)

    // Author
    const author =
      $(".author a, .manga-author a, .author-content a, .info:contains('Author') + .value, .detail:contains('Author') + .value")
        .map((_i, el) => $(el).text().trim())
        .get()
        .filter((a: string) => a.length > 0)
        .join(", ")

    // Artist
    const artist =
      $(".artist a, .manga-artist a, .artist-content a")
        .map((_i, el) => $(el).text().trim())
        .get()
        .filter((a: string) => a.length > 0)
        .join(", ")

    // Status
    const statusText =
      $(".status, .manga-status, .info:contains('Status') + .value, .detail:contains('Status') + .value")
        .text()
        .trim()
        .toLowerCase()
    let status = 0 // Ongoing
    if (statusText.includes("completed")) status = 1
    else if (statusText.includes("hiatus") || statusText.includes("on hold")) status = 2
    else if (statusText.includes("cancelled") || statusText.includes("canceled") || statusText.includes("dropped")) status = 3

    // Type
    const typeText =
      $(".type, .manga-type, .info:contains('Type') + .value, .detail:contains('Type') + .value")
        .text()
        .trim()
        .toLowerCase()
    let contentType: number | undefined
    if (typeText.includes("manhwa")) contentType = 2
    else if (typeText.includes("manhua")) contentType = 1
    else if (typeText.includes("manga")) contentType = 0
    else if (typeText.includes("webtoon")) contentType = 2

    // Determine NSFW from genres
    const nsfwGenres = ["ecchi", "smut", "yaoi", "yuri", "adult", "mature"]
    const isNSFW = genres.some((g: string) =>
      nsfwGenres.some((ng) => g.toLowerCase().includes(ng)),
    )

    // Chapters
    const chapters = await this.getChapters(contentId)

    // Properties
    const properties: Property[] = []
    if (genres.length > 0) {
      properties.push({
        id: "genres",
        title: "Genres",
        tags: genres.map((g: string, i: number) => ({
          id: i.toString(),
          title: g,
          nsfw: nsfwGenres.some((ng) => g.toLowerCase().includes(ng)),
          noninteractive: false,
        })),
      })
    }

    return {
      title,
      cover,
      summary,
      creators: [author, artist].filter(Boolean),
      status,
      isNSFW,
      chapters,
      properties,
      contentType: contentType as any,
      recommendedPanelMode: ReadingMode.PAGED_MANGA,
      webUrl: `${this.baseUrl}/title-detail/${contentId}/`,
    }
  }

  // ---- Chapters ----

  async getChapters(contentId: string): Promise<Chapter[]> {
    await this.ensureNsfwCookie()

    // contentId is the slug; extract the numeric title_id
    const titleId = this.extractTitleId(contentId)

    const result = await this.apiPost<ChapterListResponse>(
      "chapter/chapter-listing-by-title-id/",
      {
        title_id: titleId,
      },
    )

    const chapters: Chapter[] = []
    let index = 0

    for (const ch of result.chapters ?? []) {
      const chapterNumber =
        typeof ch.number === "string" ? parseFloat(ch.number) || index + 1 : ch.number

      for (const translation of ch.translations ?? []) {
        // Filter by language — default to English
        const lang = translation.language?.toUpperCase() || "EN_US"
        const langCode = this.normalizeLanguage(lang)

        const volume =
          typeof translation.volume === "string"
            ? parseInt(translation.volume, 10) || undefined
            : translation.volume ?? undefined

        const chapterId = translation.id?.toString() || `${chapterNumber}-${index}`

        const dateStr = translation.date
        let date: Date
        try {
          date = dateStr ? new Date(dateStr) : new Date(0)
          if (isNaN(date.getTime())) date = new Date(0)
        } catch {
          date = new Date(0)
        }

        const groupNames: string[] = []
        if (translation.group?.name) {
          groupNames.push(translation.group.name)
        }

        const titleParts: string[] = [`Chapter ${chapterNumber}`]
        if (translation.name) {
          titleParts.push(translation.name)
        }

        chapters.push({
          chapterId,
          title: titleParts.join(" - "),
          number: chapterNumber,
          index,
          language: langCode,
          volume,
          date,
        })
        index++
      }
    }

    return chapters
  }

  // ---- Chapter Data (Pages) ----

  async getChapterData(
    _contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    await this.ensureNsfwCookie()

    // chapterId is the translation id; fetch the chapter detail page
    const response = await this.client.get(`${this.baseUrl}/chapter-detail/${chapterId}/`)
    const html = response.data

    // Extract chapterImages from embedded JS:
    // const chapterImages = JSON.parse(`[...]`)
    const imagesMatch = html.match(
      /const\s+chapterImages\s+=\s+JSON\.parse\(`([^`]+)`\)/,
    )

    if (imagesMatch) {
      try {
        const imagesJson = imagesMatch[1]
        const images = JSON.parse(imagesJson) as string[]
        if (Array.isArray(images) && images.length > 0) {
          return {
            pages: images.map((url) => ({
              url: url.startsWith("http") ? url : `${this.baseUrl}${url}`,
            })),
          }
        }
      } catch {
        // Fall through to HTML parsing
      }
    }

    // Fallback: parse image elements from HTML
    const $ = load(html)
    const pageElements = $(
      ".chapter-images img, .reading-content img, .page-break img, .manga-page img",
    ).toArray()

    const pages = pageElements
      .map((el) => {
        const url =
          $(el).attr("data-src")?.trim() ||
          $(el).attr("data-lazy-src")?.trim() ||
          $(el).attr("src")?.trim() ||
          $(el).attr("data-cfsrc")?.trim() ||
          undefined
        if (!url) return null
        return {
          url: url.startsWith("http") ? url : `${this.baseUrl}${url}`,
        }
      })
      .filter((p): p is { url: string } => p !== null)

    return { pages }
  }

  // ---- Helpers ----

  /**
   * Normalizes language codes from the site format to Suwatte format.
   * MangaBall uses codes like "en", "ja", "ko", "zh", "fr", "es", "pt" etc.
   */
  private normalizeLanguage(lang: string): string {
    const langMap: Record<string, string> = {
      EN: "EN_US",
      EN_US: "EN_US",
      ENGLISH: "EN_US",
      JA: "ja_JP",
      JA_JP: "ja_JP",
      JAPANESE: "ja_JP",
      KO: "ko_KR",
      KO_KR: "ko_KR",
      KOREAN: "ko_KR",
      ZH: "zh-CN",
      "ZH-CN": "zh-CN",
      CHINESE: "zh-CN",
      FR: "fr_FR",
      FR_FR: "fr_FR",
      FRENCH: "fr_FR",
      ES: "es_ES",
      ES_ES: "es_ES",
      SPANISH: "es_ES",
      PT: "pt_BR",
      PT_BR: "pt_BR",
      PORTUGUESE: "pt_BR",
    }
    return langMap[lang] || lang
  }
}