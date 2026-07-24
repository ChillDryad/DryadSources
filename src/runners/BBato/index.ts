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
  baseUrl = "https://bbato.to"

  info: RunnerInfo = {
    id: "kusa.bbato",
    name: "BBato",
    thumbnail: "bbato.png",
    version: 1.0,
    website: this.baseUrl,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.MIXED,
  }
  client = new NetworkClient()

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const page = request.page || 1
    const params: Record<string, string | string[] | undefined> = {}

    if (request.query) {
      params.keyword = request.query
    }
    if (page > 1) {
      params.page = page.toString()
    }

    // Apply filters
    if (request.filters?.genres) {
      params["genre[]"] = request.filters.genres as string[]
    }
    if (request.filters?.status) {
      params["status[]"] = request.filters.status as string[]
    }
    if (request.filters?.type) {
      params["type[]"] = request.filters.type as string[]
    }
    if (request.sort?.id) {
      params.sort = request.sort.id
    }

    const url = request.query || request.filters
      ? `${this.baseUrl}/filter`
      : `${this.baseUrl}/updated`

    const response = await this.client.get(url, { params })
    const $ = load(response.data)

    const items = $(".original.card-lg .unit, .card-lg .unit").toArray()
    const highlights = items.map((item) => {
      const link = $(item).find("a.poster").first()
      const href = link.attr("href") || ""
      const id = href.replace(`${this.baseUrl}/`, "")
      const title = $(item).find(".info > a").text().trim() || $(item).find("span").first().text().trim()
      const img = $(item).find("a.poster img, img").first()
      const cover = img.attr("data-src") || img.attr("src") || ""
      return { id, title, cover }
    })

    const hasNext = $(".pagination a[rel=next]").length > 0

    return {
      results: highlights,
      isLastPage: !hasNext,
    }
  }

  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.get(`${this.baseUrl}/${contentId}`)
    const $ = load(response.data)

    const title = $("h1[itemprop=name]").text().trim()
    const cover = $(".poster img").attr("data-src") || $(".poster img").attr("src") || ""
    const description = $(".description").text().trim()
    const author = $(".meta div:has(span:contains(Author)) a").map((_i, el) => $(el).text().trim()).get().join(", ")
    const genres = $(".meta div:has(span:contains(Genres)) a").map((_i, el) => $(el).text().trim()).get()
    const statusText = $(".info > p").text().trim().toLowerCase()

    let status = 0
    if (statusText.includes("ongoing") || statusText.includes("releasing")) status = 0
    else if (statusText.includes("completed")) status = 1
    else if (statusText.includes("hiatus")) status = 2
    else if (statusText.includes("discontinued") || statusText.includes("cancelled")) status = 3

    const chapters = await this.getChapters(contentId)

    return {
      title,
      cover,
      summary: description,
      creators: author ? [author] : [],
      status,
      isNSFW: false,
      chapters,
      recommendedPanelMode: ReadingMode.PAGED_COMIC,
      webUrl: `${this.baseUrl}/${contentId}`,
    }
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    const slug = contentId.split("/").pop() || contentId
    const response = await this.client.get(`${this.baseUrl}/get-chapter-list`, {
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        Referer: `${this.baseUrl}/${contentId}`,
      },
      params: { slug },
    })

    let chapterData: Array<{ chapter_name: string; chapter_slug: string; updated_at: string }> = []
    try {
      const parsed = JSON.parse(response.data)
      chapterData = parsed.data ?? []
    } catch {
      // Fall back to HTML parsing
      const htmlResponse = await this.client.get(`${this.baseUrl}/${contentId}`)
      const $ = load(htmlResponse.data)
      const entries = $(".chapter-list li, .list-chapter li").toArray()
      chapterData = entries.map((el) => ({
        chapter_name: $(el).find("a").text().trim(),
        chapter_slug: $(el).find("a").attr("href")?.split("/").pop() || "",
        updated_at: $(el).find(".chapter-date, .text-center").text().trim(),
      }))
    }

    const chapters: Chapter[] = chapterData.map((ch, i) => {
      const numberMatch = ch.chapter_name.match(/(\d+(\.\d+)?)/)
      const number = numberMatch ? parseFloat(numberMatch[1]) : i + 1
      return {
        chapterId: `/read/${slug}/${ch.chapter_slug}`,
        title: ch.chapter_name,
        number,
        index: i,
        language: "EN_US",
        date: ch.updated_at ? new Date(ch.updated_at) : new Date(0),
      }
    })

    return chapters
  }

  async getChapterData(
    _contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const url = `${this.baseUrl}${chapterId}`
    const response = await this.client.get(url)
    const $ = load(response.data)

    const pages = $(".pages .page:not(.notice-page) img").toArray()
      .map((img) => {
        const url = $(img).attr("data-src") || $(img).attr("src") || ""
        return url ? { url } : null
      })
      .filter((p): p is { url: string } => p !== null)

    return { pages }
  }

  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {
      filters: [
        {
          id: "type",
          title: "Type",
          type: FilterType.MULTISELECT,
          options: [
            { id: "manga", title: "Manga" },
            { id: "one-shot", title: "One Shot" },
            { id: "doujinshi", title: "Doujinshi" },
            { id: "novel", title: "Novel" },
            { id: "manhwa", title: "Manhwa" },
            { id: "manhua", title: "Manhua" },
          ],
        },
        {
          id: "genres",
          title: "Genres",
          type: FilterType.MULTISELECT,
          options: BATO_GENRES,
        },
        {
          id: "status",
          title: "Status",
          type: FilterType.MULTISELECT,
          options: [
            { id: "completed", title: "Completed" },
            { id: "releasing", title: "Releasing" },
            { id: "on_hiatus", title: "On Hiatus" },
            { id: "discontinued", title: "Discontinued" },
            { id: "info", title: "Not Yet Published" },
          ],
        },
      ],
      sort: {
        options: [
          { id: "recently_updated", title: "Recently Updated" },
          { id: "recently_added", title: "Recently Added" },
          { id: "release_date", title: "Release Date" },
          { id: "title_az", title: "Name A-Z" },
        ],
        canChangeOrder: false,
        default: { id: "recently_updated" },
      },
    }
  }
}

const BATO_GENRES: Tag[] = [
  { id: "action", title: "Action" },
  { id: "adventure", title: "Adventure" },
  { id: "avant-garde", title: "Avant Garde" },
  { id: "boys-love", title: "Boys Love" },
  { id: "comedy", title: "Comedy" },
  { id: "demons", title: "Demons" },
  { id: "drama", title: "Drama" },
  { id: "ecchi", title: "Ecchi" },
  { id: "fantasy", title: "Fantasy" },
  { id: "girls-love", title: "Girls Love" },
  { id: "gourmet", title: "Gourmet" },
  { id: "harem", title: "Harem" },
  { id: "horror", title: "Horror" },
  { id: "isekai", title: "Isekai" },
  { id: "iyashikei", title: "Iyashikei" },
  { id: "josei", title: "Josei" },
  { id: "kids", title: "Kids" },
  { id: "magic", title: "Magic" },
  { id: "mahou-shoujo", title: "Mahou Shoujo" },
  { id: "martial-arts", title: "Martial Arts" },
  { id: "mecha", title: "Mecha" },
  { id: "military", title: "Military" },
  { id: "music", title: "Music" },
  { id: "mystery", title: "Mystery" },
  { id: "parody", title: "Parody" },
  { id: "psychological", title: "Psychological" },
  { id: "reverse-harem", title: "Reverse Harem" },
  { id: "romance", title: "Romance" },
  { id: "school", title: "School" },
  { id: "sci-fi", title: "Sci-Fi" },
  { id: "seinen", title: "Seinen" },
  { id: "shoujo", title: "Shoujo" },
  { id: "shounen", title: "Shounen" },
  { id: "slice-of-life", title: "Slice of Life" },
  { id: "space", title: "Space" },
  { id: "sports", title: "Sports" },
  { id: "super-power", title: "Super Power" },
  { id: "supernatural", title: "Supernatural" },
  { id: "suspense", title: "Suspense" },
  { id: "thriller", title: "Thriller" },
  { id: "vampire", title: "Vampire" },
]