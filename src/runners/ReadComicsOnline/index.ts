import {
  CatalogRating,
  Chapter,
  ChapterData,
  Content,
  ContentSource,
  DeepLinkContext,
  DirectoryConfig,
  DirectoryRequest,
  FilterType,
  PagedResult,
  Property,
  RunnerInfo,
  SourceConfig,
} from "@suwatte/daisuke"
import { BASE_URL, GENRES, STATUS, TYPE } from "./constants"
import { load } from "cheerio"

export class Target implements ContentSource {
  info: RunnerInfo = {
    id: "kusa.readcomicsonline",
    name: "ReadComicsOnline.ru",
    version: 0.1,
    website: BASE_URL,
    thumbnail: "readcomicsonline.png", //todo: get this
    supportedLanguages: ["EN_US"],
    minSupportedAppVersion: "5.0",
    rating: CatalogRating.MIXED,
  }

  client = new NetworkClient()

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const params: Record<
      string,
      string | string[] | boolean | undefined | number
    > = {}
    let url = ""
    let results
    let response

    params.page = request.page
    if (request.query) {
      url = `${BASE_URL}/search`
      params.query = request.query
      response = await this.client.get(url, { params })
      // @ts-expect-error need better type
      results = JSON.parse(response.data).suggestions.map((suggestion) => ({
        id: suggestion.data,
        cover: `${BASE_URL}/${suggestion.data}/cover/cover_250x350`,
        title: suggestion.value,
      }))
    } else {
      url = `${BASE_URL}/filterList`
      response = await this.client.get(
        `${url}?sortBy=${request.sort?.id ?? "name"}&asc=${
          request.sort?.ascending || false
        }`,
      )
      const $ = load(response.data)
      const entries = $(".col-sm-6").toArray()
      results = entries.map((entry) => {
        const title = $("h5.media-heading", entry).text()
        const cover = `https:${$("div.media-left a img", entry).attr("src")}`
        const id = $("div.media-left a", entry).attr("href").split("/comic/")[1]

        return {
          title,
          cover,
          id,
        }
      })
    }

    return {
      results,
      isLastPage: true,
    }
  }
  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.get(`${BASE_URL}/comic/${contentId}`)
    const $ = load(response.data)

    return {
      title: $("h2.listmanga-header").first().text().trim(),
      cover: `https:${$("div.boxed img").attr("src").trim()}`,
    }
  }
  async getChapters(contentId: string): Promise<Chapter[]> {
    const response = await this.client.get(`${BASE_URL}/comic/${contentId}`)
    const $ = load(response.data)
    const chapterList = $("ul.chapters li").toArray()
    const chapters: Chapter[] = []
    for (const chapter in chapterList) {
      chapters.push({
        title: $("h5.chapter-title-rtl", chapterList[chapter]).text().trim(),
        index: Number(chapter),
        chapterId: $("a", chapterList[chapter])
          .attr("href")
          .split(`${contentId}/`)[1],
        number: chapterList.length - Number(chapter),
        language: "EN_US",
        date: new Date(),
        // $("div.action div.date-chapter-title-rtl").text().trim(),
      })
    }
    return chapters
  }
  async getChapterData(
    contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    console.log(`${BASE_URL}/comic/${contentId}/${chapterId}`)
    const response = await this.client.get(
      `${BASE_URL}/comic/${contentId}/${chapterId}`,
    )
    const $ = load(response.data)
    const images = $("div#all img").toArray()
    const pages = images.map((image) => ({
      url: $(image).attr("data-src").trim(),
    }))
    return { pages }
  }
  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {
      sort: {
        options: [
          { id: "views", title: "Popular" },
          { id: "name", title: "Name" },
          { id: "last_release", title: "Last Release" },
        ],
        canChangeOrder: true,
        default: {
          id: "views",
        },
      },
    }
  }
}
