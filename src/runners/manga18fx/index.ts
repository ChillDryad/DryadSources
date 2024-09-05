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
import { Element, load } from "cheerio"
import { GENRES } from "./constants"

export class Target implements ContentSource {
  baseUrl = "https://manga18fx.com"
  client = new NetworkClient()

  info: RunnerInfo = {
    id: "kusa.manga18fx",
    name: "Manga18fx",
    thumbnail: "manga18fx.jpg",
    version: 0.1,
    website: this.baseUrl,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.NSFW,
  }

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    let url = this.baseUrl

    console.log(request)

    if (request.query)
      url = `${url}/search?q=${request.query.replace(" ", "+")}${
        request.page ? `&page=${request.page}` : ""
      }`
    else if (request?.filters?.genres)
      url = `${url}/manga-genre/${request.filters.genres}${
        request.page ? `/${request.page}` : ""
      }`

    const response = await this.client.get(url)

    const $ = load(response.data)
    const webtoons = $("div.listupd div.page-item").toArray()
    const highlights = webtoons.map((webtoon: Element) => {
      return {
        title: $("h3 a", webtoon).text().trim(),
        id: $("h3 a", webtoon).attr("href"),
        cover:
          $("div.thumb-manga a img", webtoon).attr("data-src") ??
          $("div.thumb-manga a img", webtoon).attr("src"),
      }
    })

    return {
      results: highlights,
      isLastPage: highlights.length < 24,
    }
  }

  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.get(`${this.baseUrl}${contentId}`)
    const $ = load(response.data)

    const title = $("h1").text().trim()
    const cover =
      $("div.tab-summary div.summary_image img").attr("data-src") ??
      $("div.tab-summary div.summary_image img").attr("src")
    const summary = $("div.panel-story-description div.dsct").text()
    const additionalTitles = $("")
    const chapters = await this.getChapters(contentId)
    return {
      title,
      cover,
      summary,
      chapters,
    }
  }
  async getChapters(contentId: string): Promise<Chapter[]> {
    const response = await this.client.get(`${this.baseUrl}${contentId}`)
    const $ = load(response.data)
    const data = $("li.a-h").toArray()
    const chapters = data.map((chapter: Element, i: number) => {
      const chapterNumber = Number(
        $("a.chapter-name", chapter)
          .text()
          .match(/(\d|\.)+/g)?.[0],
      )
      return {
        chapterId: $("a.chapter-name", chapter)
          .attr("href")
          .split("manga/")[1]
          .split("/")[1],
        title: $("a.chapter-name", chapter).text(),
        index: i,
        number: chapterNumber,
        language: "EN_US",
        date: new Date(), //new Date($("span.chapter-time", chapter).text()) ??
        webUrl: `${this.baseUrl}${$("a.chapter-name", chapter).attr("href")}`,
      }
    })
    return chapters
  }
  async getChapterData(
    contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const response = await this.client.get(
      `${this.baseUrl}${contentId}/${chapterId}`,
    )
    const $ = load(response.data)
    const pages = $("div.page-break")
      .toArray()
      .map((page: Element, i: number) => {
        return { url: $("img", page).attr("data-src") ?? $("img").attr("src") }
      })
    console.log(pages)
    return { pages }
  }

  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {
      filters: [
        {
          id: "genres",
          title: "Genres",
          type: FilterType.SELECT,
          options: GENRES,
        },
      ],
    }
  }
}
