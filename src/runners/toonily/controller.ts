import {
  type ChapterData,
  type DirectoryRequest,
  type DirectoryFilter,
  type PagedResult,
  FilterType,
  NetworkResponse,
  NetworkClientBuilder,
} from "@suwatte/daisuke"
import { ADULT_TAGS, BASE_URL, GENRES, STATUS_TAGS } from "./constants"
import Parser from "./parser"
import { interceptor } from "./interceptor"

export default class Controller {
  private BASE = BASE_URL
  private parser = new Parser()
  private client = new NetworkClientBuilder()
    .addRequestInterceptor(interceptor)
    .build()

  getFilters(): DirectoryFilter[] {
    return [
      {
        id: "genres",
        title: "Genres",
        type: FilterType.MULTISELECT,
        options: GENRES,
      },
      {
        id: "matchAll",
        title: "All Genre's?",
        type: FilterType.TOGGLE,
      },
      {
        id: "adult",
        title: "Adult",
        type: FilterType.SELECT,
        options: ADULT_TAGS,
      },
      {
        id: "status",
        title: "Upload Status",
        type: FilterType.SELECT,
        options: STATUS_TAGS,
      },
    ]
  }
  async getSearchResults(query: DirectoryRequest): Promise<PagedResult> {
    const params: Record<string, unknown> = {}
    const page = query.page
    const search = query?.query !== undefined ? `/${query.query}` : ""

    if (query.filters?.genres)
      query.filters.genres.map((genre: string, i: number) => {
        params[`genre[${i}]`] = genre
      })
    if (query.filters?.matchAll) params.op = 1
    if (query.filters?.adult) params.adult = query.filters.adult
    if (query.filters?.status) params.status = `[0]${query.filters.status}`

    params.m_orderby = query.sort?.id ?? ""

    const response: NetworkResponse = await this.client.get(
      `${this.BASE}/search${search}/page/${page}`,
      { params },
    )
    const results = this.parser.parsePagedResponse(response.data)

    return {
      results,
      isLastPage: results.length > 18,
    }
  }
  async getContent(id: string) {
    const response = await this.client.get(`${this.BASE}/webtoon/${id}`)
    return this.parser.parseContent(response.data, id)
  }
  async getChapters(id: string) {
    const response = await this.client.post(
      `${this.BASE}/webtoon/${id}/ajax/chapters`,
    )
    return this.parser.parseChapters(response.data)
  }
  async getChapterData(chapterId: string): Promise<ChapterData> {
    const response = await this.client.get(`${this.BASE}/webtoon/${chapterId}`)
    const pages = this.parser.parsePages(response.data)
    return { pages }
  }
}
