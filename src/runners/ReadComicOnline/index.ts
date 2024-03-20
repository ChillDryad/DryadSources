import {
  CatalogRating,
  type Chapter,
  type ChapterData,
  type Content,
  type ContentSource,
  type DirectoryConfig,
  type DirectoryRequest,
  type PagedResult,
  RunnerInfo,
  FilterType,
  NetworkClientBuilder,
} from "@suwatte/daisuke"
import { BASE, GENRES, SORT } from "./constants"
import { Parser } from "./parser"

export class Target implements ContentSource {
  info: RunnerInfo = {
    id: "li.readcomiconline",
    name: "ReadComicOnline",
    thumbnail: "readcomiconline.png", // TODO: Get this.
    website: BASE,
    version: 0.2,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.SAFE,
  }


  client = new NetworkClientBuilder().setRateLimit(5, 30).build()
  parser = new Parser()

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    let url
    const params: Record<string, string | number> = {}
    params.page = request.page ?? 1
    params.sort = request.sort?.id ?? "MostPopular"

    if (request.query || request?.filters?.genres) {
      url = `${BASE}/AdvanceSearch`

      params.comicName = request.query ?? ""
      params.ig = request.filters?.genres?.included.join("%2C") ?? ""
      params.eg = request.filters?.genres?.excluded.join("%2C") ?? ""
    } else {
      url = `${BASE}/ComicList/`
    }
    const response = await this.client.get(url, { params })
    const results = this.parser.parseDirectory(response.data)
    return {
      results,
      isLastPage: results.length < 32,
    }
  }
  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.get(`${BASE}${contentId}`)
    const content = this.parser.parseComic(response.data)
    return content
  }
  async getChapters(contentId: string): Promise<Chapter[]> {
    const response = await this.client.get(`${BASE}${contentId}`)
    const content = this.parser.parseChapters(response.data)
    return content
  }
  async getChapterData(
    _contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const response = await this.client.get(`${BASE}${chapterId}`)
    const pages = this.parser.parsePages(response.data)
    console.log(pages)
    return { pages }
  }
  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {
      filters: [
        {
          id: "genres",
          title: "Genres",
          subtitle: "These filters will not apply when searching by keyword.",
          type: FilterType.EXCLUDABLE_MULTISELECT,
          options: GENRES.sort((a, b) => (a.title > b.title ? 1 : -1)),
        },
      ],
      sort: {
        options: SORT,
        default: {
          id: "MostPopular",
        },
      },
    }
  }
}
