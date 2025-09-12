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
import { ADULT, SORT, STATUS, TAGS } from "./constants"

export class Target implements ContentSource {
  baseURL = "https://www.mangago.me"
  client = new NetworkClient()

  parser = new Parser()

  info: RunnerInfo = {
    id: "kusa.mangago",
    name: "Mangago",
    thumbnail: "mangago.png",
    version: 0.4,
    website: this.baseURL,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.MIXED,
  }

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    let url = ""
    if (request?.query) {
      url = `${this.baseURL}/r/l_search/?name=${request.query}&page=${
        request.page || 1
      }`
      const response = await this.client.get(url)
      const results = this.parser.parseQuery(response.data)
      return {
        results,
        isLastPage: results.length < 10,
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
        request.filters?.status?.includes("completed") ? "0" : "1"
      }&o=${
        request.filters?.status?.includes("ongoing") ? "0" : "1"
      }&sortby=${request.sort.id || "view"}&e=${excluded.length > 0 ? excluded.join(",") : ""}`
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
          options: TAGS.sort((a, b) =>
            a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1,
          ),
        },
        {
          id: "status",
          title: "Upload Status",
          type: FilterType.MULTISELECT,
          options: STATUS.sort((a, b) =>
            a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1,
          ),
        },
        {
          id: "adult",
          title: "Adult Genres",
          type: FilterType.EXCLUDABLE_MULTISELECT,
          options: ADULT.sort((a, b) =>
            a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1,
          ),
        },
      ],
      sort: {
        options: SORT,
        default: {
          id: "comment_count",
        },
      },
    }
  }
}
