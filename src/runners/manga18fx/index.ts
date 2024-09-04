import {
  CatalogRating,
  Chapter,
  ChapterData,
  Content,
  ContentSource,
  DeepLinkContext,
  DirectoryConfig,
  DirectoryRequest,
  PagedResult,
  Property,
  RunnerInfo,
  SourceConfig,
} from "@suwatte/daisuke"
import { Element, load } from "cheerio"

export class Target implements ContentSource {
  baseUrl = "https://manga18fx.com/"
  client = new NetworkClient()

  info: RunnerInfo = {
    id: "kusa.manga18fx",
    name: "Manga18fx",
    thumbnail: "manga18fx.png", //todo: get
    version: 0.1,
    website: this.baseUrl,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.NSFW,
  }

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const params: Record<
      string,
      string | string[] | boolean | undefined | number
    > = {}

    const response = await this.client.get(this.baseUrl)

    const $ = load(response.data)
    const webtoons = $("div.listupd div.page-item").toArray()
    const highlights = webtoons.map((webtoon: Element) => {
      console.log($(webtoon).html())
    })
    // const highlights = webtoons.map(webtoon: Element => (

    // ))
    throw new Error("Method not implemented.")
  }

  async getContent(contentId: string): Promise<Content> {
    throw new Error("Method not implemented.")
  }
  async getChapters(contentId: string): Promise<Chapter[]> {
    throw new Error("Method not implemented.")
  }
  async getChapterData(
    contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    throw new Error("Method not implemented.")
  }

  async getDirectoryConfig(configID?: string): Promise<DirectoryConfig> {
    throw new Error("Method not implemented.")
  }
}
