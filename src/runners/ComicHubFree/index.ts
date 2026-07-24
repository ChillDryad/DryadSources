import {
  CatalogRating,
  type Chapter,
  type ChapterData,
  type Content,
  type ContentSource,
  type DirectoryConfig,
  type DirectoryRequest,
  type PagedResult,
  type RunnerInfo,
  ReadingMode,
} from "@suwatte/daisuke"
import { load } from "cheerio"

export class Target implements ContentSource {
  baseUrl = "https://comichubfree.com"

  info: RunnerInfo = {
    id: "kusa.comichubfree",
    name: "ComicHubFree",
    thumbnail: "comichubfree.png",
    version: 1.0,
    website: this.baseUrl,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.MIXED,
  }
  client = new NetworkClient()

  private imageAttr(el: any): string {
    if (el.attr("data-src")) return el.attr("data-src")
    return el.attr("src") || ""
  }

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const page = request.page || 1
    let url: string

    if (request.query) {
      url = `${this.baseUrl}/search-comic`
    } else {
      url = `${this.baseUrl}/popular-comic`
    }

    const params: Record<string, string | number | undefined> = { page: page.toString() }
    if (request.query) params.key = request.query

    const response = await this.client.get(url, { params })
    const $ = load(response.data)

    const items = $(".movie-list-index > .cartoon-box:has(.detail)").toArray()
    const highlights = items.map((item) => {
      const link = $(item).find("a").first()
      const href = link.attr("href") || ""
      const id = href.replace(`${this.baseUrl}/`, "")
      const title = $(item).find("h3").text().trim()
      const img = $(item).find("img").first()
      const cover = this.imageAttr(img)
      return { id, title, cover }
    })

    const hasNext = $("ul.pagination a[rel=next]:not(hidden)").length > 0

    return {
      results: highlights,
      isLastPage: !hasNext,
    }
  }

  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.get(`${this.baseUrl}/${contentId}`)
    const $ = load(response.data)

    const infoElement = $("div.movie-info")
    const seriesInfo = infoElement.find("div.series-info")
    const description = infoElement.find("div#film-content").text().trim()
    const cover = this.imageAttr(seriesInfo.find("img"))
    const author = seriesInfo.find("dt:contains(Authors:) + dd").text().trim()
    const statusText = seriesInfo.find("dt:contains(Status:) + dd").text().trim()

    let status = 0
    if (statusText === "Ongoing") status = 0
    else if (statusText === "Completed") status = 1

    const chapters = await this.getChapters(contentId)

    return {
      title: $("h1").first().text().trim() || contentId,
      cover,
      summary: description,
      creators: author ? [author] : [],
      status,
      isNSFW: false,
      chapters,
      recommendedPanelMode: ReadingMode.PAGED_COMIC,
      webUrl: `${this.baseUrl}/${contentId}`,
    }
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    const chapters: Chapter[] = []
    let response = await this.client.get(`${this.baseUrl}/${contentId}`)
    let $ = load(response.data)

    while (true) {
      const entries = $("div.episode-list > div > table > tbody > tr").toArray()
      for (let i = 0; i < entries.length; i++) {
        const el = entries[i]
        const link = $(el).find("a").first()
        const href = link.attr("href") || ""
        const chapterId = href.replace(`${this.baseUrl}/`, "")
        const name = link.text().trim()
        const dateText = $(el).find("td:last-of-type").text().trim()
        const numberMatch = name.match(/(\d+(\.\d+)?)/)
        const number = numberMatch ? parseFloat(numberMatch[1]) : i + 1
        chapters.push({
          chapterId,
          title: name,
          number,
          index: i,
          language: "EN_US",
          date: dateText ? new Date(dateText) : new Date(0),
        })
      }

      const nextUrl = $("ul.pagination a[rel=next]:not(hidden)").attr("href")
      if (!nextUrl) break
      response = await this.client.get(nextUrl)
      $ = load(response.data)
    }

    return chapters
  }

  async getChapterData(
    _contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const url = `${this.baseUrl}/${chapterId}/all`
    const response = await this.client.get(url)
    const $ = load(response.data)

    const seen = new Set<string>()
    const pages = $("img.chapter_img").toArray()
      .map((el) => {
        const url = this.imageAttr($(el))
        return url ? { url } : null
      })
      .filter((p): p is { url: string } => p !== null)
      .filter((p) => {
        if (seen.has(p.url)) return false
        seen.add(p.url)
        return true
      })

    return { pages }
  }

  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {}
  }
}