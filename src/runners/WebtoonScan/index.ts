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
  baseUrl = "https://webtoonscan.com"

  info: RunnerInfo = {
    id: "kusa.webtoonscan",
    name: "WebtoonScan",
    thumbnail: "webtoonscan.png",
    version: 1.0,
    website: this.baseUrl,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.MIXED,
  }
  client = new NetworkClient()

  private imageFromElement(el: any): string {
    return (
      el.attr("data-src") ||
      el.attr("data-lazy-src") ||
      el.attr("srcset") ||
      el.attr("data-cfsrc") ||
      el.attr("src") ||
      ""
    )
  }

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const page = request.page || 1
    const url = request.query
      ? `${this.baseUrl}/?s=${encodeURIComponent(request.query)}&post_type=wp-manga`
      : `${this.baseUrl}/manga/${page > 1 ? `page/${page}/` : ""}?m_orderby=latest`

    const response = await this.client.get(url)
    const $ = load(response.data)

    const items = $(".c-tabs-item__content, .manga__item, .page-item-detail:not(:has(a[href*='bilibilicomics.com']))").toArray()
    const highlights = items.map((item) => {
      const titleEl = $(item).find("div.post-title a, h3 a, .post-title a").first()
      const href = titleEl.attr("href") || ""
      const id = href.replace(`${this.baseUrl}/manga/`, "").replace(/\/$/, "")
      const title = titleEl.text().trim()
      const img = $(item).find("img").first()
      const cover = this.imageFromElement(img)
      return { id, title, cover }
    })

    const hasNext = $("div.nav-previous a, nav.navigation-ajax, a.nextpostslink").length > 0

    return {
      results: highlights,
      isLastPage: !hasNext,
    }
  }

  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.get(`${this.baseUrl}/manga/${contentId}/`)
    const $ = load(response.data)

    const title = $("div.post-title h3, div.post-title h1, #manga-title h1").first().text().trim()
    const cover = this.imageFromElement($(".summary_image img").first())
    const description = $(".description-summary .summary__content p, .summary_content .post-content_item > h5 + div, .summary_content .manga-excerpt")
      .map((_i, el) => $(el).text().trim())
      .get()
      .join("\n\n")
    const author = $(".author-content a").map((_i, el) => $(el).text().trim()).get().join(", ")
    const artist = $(".artist-content a").map((_i, el) => $(el).text().trim()).get().join(", ")
    const genres = $(".genres-content a").map((_i, el) => $(el).text().trim()).get()
    const statusText = $(".summary-content, div.summary-heading:contains(Status) + div").last().text().trim()

    let status = 0
    if (statusText.toLowerCase().includes("completed")) status = 1
    else if (statusText.toLowerCase().includes("ongoing")) status = 0
    else if (statusText.toLowerCase().includes("hiatus") || statusText.toLowerCase().includes("on hold")) status = 2
    else if (statusText.toLowerCase().includes("cancelled") || statusText.toLowerCase().includes("canceled")) status = 3

    const chapters = await this.getChapters(contentId)

    return {
      title,
      cover,
      summary: description,
      creators: [author, artist].filter(Boolean),
      status,
      isNSFW: false,
      chapters,
      recommendedPanelMode: ReadingMode.WEBTOON,
      webUrl: `${this.baseUrl}/manga/${contentId}/`,
    }
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    const response = await this.client.get(`${this.baseUrl}/manga/${contentId}/`)
    const $ = load(response.data)

    const chaptersHolder = $("div[id^=manga-chapters-holder]")
    let chapterElements = $("li.wp-manga-chapter").toArray()

    if (chapterElements.length === 0 && chaptersHolder.length > 0) {
      const mangaId = chaptersHolder.attr("data-id") || ""
      const mangaUrl = `${this.baseUrl}/manga/${contentId}/`
      try {
        const ajaxResponse = await this.client.post(`${mangaUrl}ajax/chapters`, {
          headers: { "X-Requested-With": "XMLHttpRequest" },
        })
        const ajaxDoc = load(ajaxResponse.data)
        chapterElements = ajaxDoc("li.wp-manga-chapter").toArray()
      } catch {
        try {
          const oldResponse = await this.client.post(`${this.baseUrl}/wp-admin/admin-ajax.php`, {
            headers: { "X-Requested-With": "XMLHttpRequest" },
            body: new URLSearchParams({
              action: "manga_get_chapters",
              manga: mangaId,
            }),
          })
          const oldDoc = load(oldResponse.data)
          chapterElements = oldDoc("li.wp-manga-chapter").toArray()
        } catch {
          // Give up
        }
      }
    }

    const chapters: Chapter[] = chapterElements.map((el, i) => {
      const link = $(el).find("a").first()
      const href = link.attr("href") || ""
      const chapterId = href.replace(this.baseUrl, "").replace("?style=list", "")
      const name = link.text().trim()
      const numberMatch = name.match(/(\d+(\.\d+)?)/)
      const number = numberMatch ? parseFloat(numberMatch[1]) : i + 1
      const dateText = $(el).find(".chapter-release-date").text().trim()
      return {
        chapterId,
        title: name,
        number,
        index: i,
        language: "EN_US",
        date: dateText ? new Date(dateText) : new Date(0),
      }
    })

    return chapters
  }

  async getChapterData(
    _contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const url = `${this.baseUrl}${chapterId}`
    const response = await this.client.get(url)
    const $ = load(response.data)

    const pageElements = $("div.page-break img, li.blocks-gallery-item img, .reading-content .text-left:not(:has(.blocks-gallery-item)) img").toArray()
    const pages = pageElements
      .map((el) => {
        const url = this.imageFromElement($(el))
        return url ? { url } : null
      })
      .filter((p): p is { url: string } => p !== null)

    return { pages }
  }

  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {
      filters: [],
      sort: {
        options: [
          { id: "views", title: "Popular" },
          { id: "latest", title: "Latest" },
          { id: "alphabet", title: "A-Z" },
          { id: "rating", title: "Rating" },
          { id: "new-manga", title: "Newest" },
          { id: "trending", title: "Trending" },
        ],
        canChangeOrder: false,
        default: { id: "latest" },
      },
    }
  }
}