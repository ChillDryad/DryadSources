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
import { load, type Element } from "cheerio"
import { GENRES } from "./constants"

export class Target implements ContentSource {
  baseUrl = "https://1st-kissmanga.net"
  client = new NetworkClient()
  info: RunnerInfo = {
    id: "kusa.1stkissmanga",
    name: "1st Kiss Manga",
    thumbnail: "1stkissmanga.png", // TODO: get
    version: 0.1,
    website: this.baseUrl,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.MIXED,
  }
  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    let url = this.baseUrl
    if (request.query)
      url = `${url}/?s=${request.query.replace(" ", "+")}${
        request.page ? `&page=${request.page}` : ""
      }&post_type=wp-manga`
    else if (request?.filters?.genres)
      url = `${url}/manga-genre/${request.filters.genres}${
        request.page ? `/${request.page}` : ""
      }&post_type=wp-manga`
    else url = `${url}/?s=&post_type=wp-manga`
    const response = await this.client.get(url)

    const $ = load(response.data)
    const webtoons = $("div.tab-content-wrap div.c-tabs-item div.row").toArray()
    const highlights = webtoons.map((webtoon: Element) => {
      return {
        title: $("div.post-title h3 a", webtoon).text().trim(),
        id: $("div.post-title a", webtoon)
          .attr("href")
          .split(`${this.baseUrl}/manga/`)[1],
        cover:
          $("div.tab-thumb a img", webtoon).attr("data-src") ??
          $("div.tab-thumb a img", webtoon).attr("src"),
      }
    })
    return {
      results: highlights,
      isLastPage: highlights.length < 20,
    }
  }
  async getChapters(contentId: string): Promise<Chapter[]> {
    const response = await this.client.get(`${this.baseUrl}/manga/${contentId}`)

    console.log(`${this.baseUrl}/${contentId}`)
    const $ = load(response.data)
    const data = $("li.wp-manga-chapter").toArray()

    const chapters = data.map((chapter: Element, i: number) => {
      const chapterNumber = Number(
        $("a", chapter)
          .text()
          .match(/(\d|\.)+/g)?.[0],
      )
      return {
        chapterId: $("a", chapter)
          .attr("href")
          .split("manga/")[1]
          .split("/")[1],
        title: $("a", chapter).text(),
        index: i,
        number: chapterNumber,
        language: "EN_US",
        // TODO: proper date parsing
        date: new Date(), //new Date($("span.chapter-release-date").text().trim() || ""),
        webUrl: `${this.baseUrl}${$("a", chapter).attr("href")}`,
      }
    })
    return chapters
  }
  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.get(`${this.baseUrl}/manga/${contentId}`)
    const $ = load(response.data)

    const title = $("h1").text().trim()
    const cover =
      $("div.tab-summary div.summary_image img").attr("data-src") ??
      $("div.tab-summary div.summary_image img").attr("src")
    const summary = $("div.summary__content p").text().trim()
    const chapters = await this.getChapters(contentId)
    return {
      title,
      cover,
      summary,
      chapters,
    }
  }

  async getChapterData(
    contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const response = await this.client.get(
      `${this.baseUrl}/manga/${contentId}/${chapterId}`,
    )
    const $ = load(response.data)
    const pages = $("div.page-break")
      .toArray()
      .map((page: Element) => {
        return {
          url: $("img", page).attr("src").trim(),
        }
      })
    console.log(pages)
    return { pages }
  }
  async getDirectoryConfig(configID?: string): Promise<DirectoryConfig> {
    return {
      // filters: [
      //   {
      //     id: "genres",
      //     title: "Genres",
      //     type: FilterType.SELECT,
      //     options: GENRES,
      //   },
      // ],
    }
  }
}
