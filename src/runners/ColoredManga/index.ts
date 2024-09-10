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
import { load } from "cheerio"

export class Target implements ContentSource {
  baseURL = "https://coloredmanga.net"
  client = new NetworkClient()

  info: RunnerInfo = {
    id: "kusa.coloredmanga",
    name: "Colored Manga",
    thumbnail: "coloredmanga.png", // TODO: grab this.
    version: 0.1,
    website: this.baseURL,
    rating: CatalogRating.SAFE,
  }

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const params: Record<
      string,
      string | string[] | boolean | undefined | number
    > = {}
    const url = `${this.baseURL}/manga`
    const genres = []
    const response = await this.client.get(url)
    const $ = load(response.data)

    console.log(url)
    const rawManga = $("script:contains('data')").html()
    // Deconstructing next response sucks.
    // error at a random spot in the JSON.
    const mangaJson = rawManga
      .split(/"data\\/)[1]
      .replace(/":\[/, '{"data":[')
      .replaceAll("\\n", "")
      .replaceAll("\\", "")
      // .replace(/\\([\\"])/g, "")
      .replace(/]}]"]\)/, "}}}}")

    // console.log(mangaJson.slice(0, 2000))
    // console.log(mangaJson.slice(mangaJson.length - 2000, mangaJson.length))
    console.log(mangaJson.length)
    console.log(JSON.parse(`${mangaJson}`).data.length)
    // //@ts-expect-error needs type
    // JSON.parse(mangaJson).data.map((manga) => {
    //   console.log(manga)
    // })

    return {
      results: [],
      isLastPage: true,
    }
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
  // async getTags?(): Promise<Property[]> {
  //   throw new Error("Method not implemented.")
  // }
  async getDirectoryConfig(configID?: string): Promise<DirectoryConfig> {
    throw new Error("Method not implemented.")
  }
}
