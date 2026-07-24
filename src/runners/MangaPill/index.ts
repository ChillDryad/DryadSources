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
  baseUrl = "https://mangapill.com"

  info: RunnerInfo = {
    id: "kusa.mangapill",
    name: "MangaPill",
    thumbnail: "mangapill.png",
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

    if (request.query) params.q = request.query
    if (request.filters?.status) params.status = request.filters.status
    if (request.filters?.type) params.type = request.filters.type
    if (request.filters?.genres) {
      const genres = request.filters.genres as string[]
      params.genre = genres
    }

    const response = await this.client.get(`${this.baseUrl}/search`, { params })
    const $ = load(response.data)

    const items = $(".grid > div:not([class])").toArray()
    const highlights = items.map((item) => {
      const link = $(item).find("a[href^='/manga/']").first()
      const href = link.attr("href") || ""
      const id = href.replace("/manga/", "").replace(/\/$/, "")
      const title = $(item).find("div.line-clamp-2").text().trim()
      const img = $(item).find("img").first()
      const cover = img.attr("data-src") || img.attr("src") || ""
      return { id, title, cover }
    })

    const hasNext = $("a.btn.btn-sm").length > 0

    return {
      results: highlights,
      isLastPage: !hasNext,
    }
  }

  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.get(`${this.baseUrl}/manga/${contentId}`)
    const $ = load(response.data)

    const title = $("div.container > div:first-child > div:last-child h1, h1").first().text().trim()
    const cover = $("div.container > div:first-child > div:first-child img").attr("data-src") ||
      $("div.container > div:first-child > div:first-child img").attr("src") || ""
    const description = $("div.container > div:first-child > div:last-child > div:nth-child(2) > p").text().trim()
    const genres = $("a[href*=genre]").map((_i, el) => $(el).text().trim()).get()
    const statusText = $("div.container > div:first-child > div:last-child > div:nth-child(3) > div:nth-child(2) > div").text().trim()

    let status = 0
    if (statusText.toLowerCase().includes("publishing")) status = 0
    else if (statusText.toLowerCase().includes("finished")) status = 1

    const chapters = await this.getChapters(contentId)

    return {
      title,
      cover,
      summary: description,
      creators: [],
      status,
      isNSFW: false,
      chapters,
      recommendedPanelMode: ReadingMode.PAGED_COMIC,
      webUrl: `${this.baseUrl}/manga/${contentId}`,
    }
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    const response = await this.client.get(`${this.baseUrl}/manga/${contentId}`)
    const $ = load(response.data)

    const chapterElements = $("#chapters > div > a").toArray()
    const chapters: Chapter[] = chapterElements.map((el, i) => {
      const href = $(el).attr("href") || ""
      const chapterId = href.replace(this.baseUrl, "")
      const name = $(el).text().trim()
      const numberMatch = name.match(/(\d+(\.\d+)?)/)
      const number = numberMatch ? parseFloat(numberMatch[1]) : i + 1
      return {
        chapterId,
        title: name,
        number,
        index: i,
        language: "EN_US",
        date: new Date(0),
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

    const pages = $("picture img").toArray().map((el) => ({
      url: $(el).attr("data-src") || $(el).attr("src") || "",
    }))

    return { pages }
  }

  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {
      filters: [
        {
          id: "status",
          title: "Status",
          type: FilterType.SELECT,
          options: [
            { id: "", title: "All" },
            { id: "publishing", title: "Publishing" },
            { id: "finished", title: "Finished" },
            { id: "on hiatus", title: "On Hiatus" },
            { id: "discontinued", title: "Discontinued" },
            { id: "not yet published", title: "Not Yet Published" },
          ],
        },
        {
          id: "type",
          title: "Type",
          type: FilterType.SELECT,
          options: [
            { id: "", title: "All" },
            { id: "manga", title: "Manga" },
            { id: "novel", title: "Novel" },
            { id: "one-shot", title: "One-Shot" },
            { id: "doujinshi", title: "Doujinshi" },
            { id: "manhwa", title: "Manhwa" },
            { id: "manhua", title: "Manhua" },
            { id: "oel", title: "Oel" },
          ],
        },
        {
          id: "genres",
          title: "Genres",
          type: FilterType.MULTISELECT,
          options: MANGAPILL_GENRES,
        },
      ],
    }
  }
}

const MANGAPILL_GENRES: Tag[] = [
  { id: "Action", title: "Action" },
  { id: "Adventure", title: "Adventure" },
  { id: "Cars", title: "Cars" },
  { id: "Comedy", title: "Comedy" },
  { id: "Dementia", title: "Dementia" },
  { id: "Demons", title: "Demons" },
  { id: "Drama", title: "Drama" },
  { id: "Ecchi", title: "Ecchi" },
  { id: "Fantasy", title: "Fantasy" },
  { id: "Game", title: "Game" },
  { id: "Harem", title: "Harem" },
  { id: "Hentai", title: "Hentai" },
  { id: "Historical", title: "Historical" },
  { id: "Horror", title: "Horror" },
  { id: "Josei", title: "Josei" },
  { id: "Kids", title: "Kids" },
  { id: "Magic", title: "Magic" },
  { id: "Martial Arts", title: "Martial Arts" },
  { id: "Mecha", title: "Mecha" },
  { id: "Military", title: "Military" },
  { id: "Music", title: "Music" },
  { id: "Mystery", title: "Mystery" },
  { id: "Parody", title: "Parody" },
  { id: "Police", title: "Police" },
  { id: "Psychological", title: "Psychological" },
  { id: "Romance", title: "Romance" },
  { id: "Samurai", title: "Samurai" },
  { id: "School", title: "School" },
  { id: "Sci-Fi", title: "Sci-Fi" },
  { id: "Seinen", title: "Seinen" },
  { id: "Shoujo", title: "Shoujo" },
  { id: "Shoujo Ai", title: "Shoujo Ai" },
  { id: "Shounen", title: "Shounen" },
  { id: "Shounen Ai", title: "Shounen Ai" },
  { id: "Slice of Life", title: "Slice of Life" },
  { id: "Space", title: "Space" },
  { id: "Sports", title: "Sports" },
  { id: "Super Power", title: "Super Power" },
  { id: "Supernatural", title: "Supernatural" },
  { id: "Thriller", title: "Thriller" },
  { id: "Vampire", title: "Vampire" },
  { id: "Yaoi", title: "Yaoi" },
  { id: "Yuri", title: "Yuri" },
]