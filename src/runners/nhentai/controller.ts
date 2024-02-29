import type {
  ChapterData,
  DirectoryRequest,
  DirectoryFilter,
  PagedResult,
  Content,
  Chapter,
} from "@suwatte/daisuke"

import { FilterType } from "@suwatte/daisuke"
import { Parser } from "./parser"
import { TAGS } from "./constants"

export class Controller {
  private BASE = "https://nhentai.net"
  private client = new NetworkClient()
  private parser = new Parser()

  getFilters(): DirectoryFilter[] {
    return [
      {
        id: "tags",
        title: "Tags",
        type: FilterType.SELECT,
        options: TAGS,
      },
    ]
  }

  async getSearchResults(query: DirectoryRequest): Promise<PagedResult> {
    const params: Record<string, unknown> = {}
    params.page = query.page ?? 1
    params.query = query.query

    let url = this.BASE
    if (query.filters?.tags !== undefined)
      url = `${url}/tag/${query.filters.tags.replaceAll(" ", "-")}`
    if (query?.tag) url = `${url}/tag/${query.tag.tagId}`
    const response = await this.client.get(url, {
      params,
    })
    const results = this.parser.parsePagedResponse(response.data)
    return { results, isLastPage: results.length > 60 }
  }
  async getContent(id: string): Promise<Content> {
    const response = await this.client.get(`${this.BASE}/g/${id}`)
    return this.parser.parseContent(response.data, id)
  }
  async getChapters(id: string): Promise<Chapter[]> {
    return [
      {
        chapterId: id.split("/")[0],
        number: 1,
        index: 1,
        date: new Date(),
        language: "en",
      },
    ]
  }
  async getChapterData(chapterId: string): Promise<ChapterData> {
    const response = await this.client.get(`${this.BASE}/g/${chapterId}`)
    return { pages: this.parser.parsePages(response.data) }
  }
}
