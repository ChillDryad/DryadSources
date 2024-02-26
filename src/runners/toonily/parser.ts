import type {
  Chapter,
  ChapterPage,
  Content,
  Highlight,
  Property,
} from "@suwatte/daisuke"

import { PublicationStatus } from "@suwatte/daisuke"
import { load, type Element } from "cheerio"
import { BASE_URL } from "./constants"

export default class Parser {
  parsePagedResponse(html: string): Highlight[] {
    const selector = "div.page-listing-item div.row div.col-6"
    const $ = load(html)
    const items = $(selector).toArray()
    const parseElement = (element: Element): Highlight => {
      const item = $("div div", element)
      const id = $("a", element)
        .attr("href")
        ?.trim()
        .match(/(?:webtoon)\/(.+)\//)?.[1]
      const cover = $("a img", item)
        .attr("data-src")
        ?.replace(/-\d+x\d+/g, "")
      const title = $("div.item-summary a", element).text()
      if (!id || !cover || !title) throw "Failed to Parse"
      return {
        id,
        cover,
        title,
      }
    }
    const highlights = items.map(parseElement)
    return highlights
  }
  parseContent(html: string, contentId: string): Content {
    const $ = load(html)
    const info = $("div.site-content div.tab-summary")
    const title = $("div.post-content h1", info).html()?.split(" <sp")[0]
    const cover = $("div.summary_image img").attr("data-src")
    const creators: string[] = []
    const summary = $("div.site-content div.summary__content p").text()
    const chapters = this.parseChapters(html)
    const properties: Property[] = []
    const additionalTitles: string[] = []

    let isNSFW: boolean = false
    let status: PublicationStatus | undefined

    for (const element of $("div.post-content_item").toArray()) {
      const title = $("h5", element).text()

      if (title.match(/genre/gi)?.[0] !== undefined) {
        const genres = $("div.genres-content a", element).toArray()
        properties.push({
          id: "genres",
          title: "Genres",
          tags: genres.map((genre) => {
            if ($(genre).text().toLowerCase() === "mature") isNSFW = true
            return {
              id: $(genre).text().toLowerCase(),
              title: $(genre).text(),
              nsfw: false,
            }
          }),
        })
      } else if (title.match(/status/gi)?.[0] !== undefined) {
        status = $("div.summary-content", element)
          .text()
          .match(/ongoing/gi)
          ? PublicationStatus.ONGOING
          : PublicationStatus.COMPLETED
      } else if (
        title.match(/(author\(s\)|artist\(s\))/gi)?.[0] !== undefined
      ) {
        creators.push($("div.summary-content a", element).text())
      } else if (title.match(/alt name/gi)?.[0] !== undefined) {
        additionalTitles.push(
          ...$("div.summary-content", element).text().trim().split(","),
        )
      }
    }
    if (creators.length > 0)
      properties.push({
        id: "creators",
        title: "Credits",
        tags: creators.map((c) => ({
          id: c.toLowerCase(),
          title: c,
          nsfw: false,
          noninteractive: true,
        })),
      })

    if (!title || !cover) throw "Couldn't parse"
    return {
      title,
      cover,
      summary,
      creators,
      status,
      isNSFW,
      chapters,
      properties,
      webUrl: `${BASE_URL}/webtoon/${contentId}`,
    }
  }
  parseChapters(html: string): Chapter[] {
    const $ = load(html)
    const chapterSelector = $("ul.main li").toArray()
    const chapters: Chapter[] = chapterSelector.map((chapter: Element, i) => {
      const chapterNumber = Number(
        $("a", chapter)
          .text()
          .match(/(\d|\.)+/g)?.[0],
      )
      const dateElement = $("i", chapter).text()
      const datePosted = dateElement.includes(",")
        ? new Date(dateElement)
        : new Date()
      const response = {
        chapterId:
          `${$("a", chapter).attr("href")?.split("webtoon/")[1]}` ?? "",
        title: $("a", chapter).text().trim() || undefined,
        number: chapterNumber,
        index: i,
        language: "EN",
        date: datePosted,
      }
      return response
    })
    return chapters
  }
  parsePages(html: string): ChapterPage[] {
    const $ = load(html)
    const images = $("div.reading-content img").toArray()
    const pages = images.map((image) => {
      return {
        url: $(image).attr("src")?.trim() ?? $(image).attr("data-src")?.trim(),
      }
    })
    return pages
  }
}
