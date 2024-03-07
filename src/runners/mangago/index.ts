import {
  CatalogRating,
  FilterType,
  type Chapter,
  type ChapterData,
  type Content,
  type ContentSource,
  type DirectoryConfig,
  type DirectoryRequest,
  type PagedResult,
  type RunnerInfo,
} from "@suwatte/daisuke"
import { Parser } from "./parser"

export class Target implements ContentSource {
  baseURL = "https://www.mangago.me"
  client = new NetworkClient()

  parser = new Parser()

  info: RunnerInfo = {
    id: "kusa.mangago",
    name: "Mangago",
    thumbnail: "mangago.png",
    version: 0.1,
    website: this.baseURL,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.MIXED,
  }

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    let url = ""

    if (request?.query) {
      url = `${this.baseURL}/r/l_search/?name=${request.query}&page=${request.page}`
      const response = await this.client.get(url)
      const results = this.parser.parseQuery(response.data)
      return {
        results,
        isLastPage: results.length < 48,
      }
    } else {
      const included = [
        ...(request.filters?.genres?.included ?? []),
        ...(request.filters?.adult?.included ?? []),
      ]
      const excluded = [
        ...(request.filters?.genres?.excluded ?? []),
        ...(request.filters?.adult?.excluded ?? []),
      ]
      url = `${this.baseURL}/genre/${
        included.length > 0 ? included.join(",") : "All"
      }/${request.page ?? 1}/?f=${
        request.filters?.status?.includes("completed") ? "0" : "1" ?? 1
      }&o=${
        request.filters?.status?.includes("ongoing") ? "0" : "1" ?? 1
      }&sortby=view&e=${excluded.length > 0 ? excluded.join(",") : ""}`
      const response = await this.client.get(url)
      const results = this.parser.parseSearch(response.data)
      return {
        results,
        isLastPage: results.length < 48,
      }
    }
  }
  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.get(
      `${this.baseURL}/read-manga/${contentId}`,
    )
    const parsed = this.parser.parseManga(response.data, contentId)
    return parsed
  }
  async getChapters(contentId: string): Promise<Chapter[]> {
    const response = await this.client.get(
      `${this.baseURL}/read-manga/${contentId}`,
    )
    const parsed = this.parser.parseChapters(response.data, contentId)
    return parsed
  }
  async getChapterData(
    contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const url = `${this.baseURL}/read-manga/${contentId}${chapterId}`
    const response = await this.client.get(url)

    return { pages: this.parser.parsePages(response.data) }
  }
  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {
      filters: [
        {
          id: "genres",
          title: "Genres",
          type: FilterType.EXCLUDABLE_MULTISELECT,
          options: [
            { id: "Yaoi", title: "Yaoi" },
            { id: "Comedy", title: "Comedy" },
            { id: "Shounen Ai", title: "Shounen Ai" },
            { id: "Shoujo", title: "Shoujo" },
            { id: "Yuri", title: "Yuri" },
            { id: "Josei", title: "Josei" },
            { id: "Fantasy", title: "Fantasy" },
            { id: "School Life", title: "School Life" },
            { id: "Romance", title: "Romance" },
            { id: "Doujinshi", title: "Doujinshi" },
            { id: "Mystery", title: "Mystery" },
            { id: "One Shot", title: "One Shot" },
            { id: "Shounen", title: "Shounen" },
            { id: "Martial Arts", title: "Martial Arts" },
            { id: "Shoujo Ai", title: "Shoujo Ai" },
            { id: "Supernatural", title: "Supernatural" },
            { id: "Drama", title: "Drama" },
            { id: "Action", title: "Action" },
            { id: "Adventure", title: "Adventure" },
            { id: "Harem", title: "Harem" },
            { id: "Historical", title: "Historical" },
            { id: "Mecha", title: "Mecha" },
            { id: "Psychological", title: "Psychological" },
            { id: "Sci-fi", title: "Sci-fi" },
            { id: "Seinen", title: "Seinen" },
            { id: "Slice Of Life", title: "Slice Of Life" },
            { id: "Sports", title: "Sports" },
            { id: "Gender Bender", title: "Gender Bender" },
            { id: "Tragedy", title: "Tragedy" },
            { id: "Bara", title: "Bara" },
            { id: "Webtoons", title: "Webtoons" },
            { id: "Horror", title: "Horror" },
          ].sort(),
        },
        {
          id: "status",
          title: "Upload Status",
          type: FilterType.MULTISELECT,
          options: [
            { id: "completed", title: "completed" },
            { id: "ongoing", title: "ongoing" },
          ],
        },
        {
          id: "adult",
          title: "Adult Genres",
          type: FilterType.EXCLUDABLE_MULTISELECT,
          options: [
            { id: "Smut", title: "Smut" },
            { id: "Adult", title: "Adult" },
            { id: "Ecchi", title: "Ecchi" },
            { id: "Mature", title: "Mature" },
          ].sort(),
        },
      ],
      sort: {
        options: [
          { id: "title", title: "Title" },
          { id: "comment_count", title: "Most Popular" },
          { id: "create_date", title: "Created" },
          { id: "update_date", title: "Updated" },
        ],
        default: {
          id: "comment_count",
        },
      },
    }
  }
}
