import type {
  Chapter,
  ChapterPage,
  Content,
  Highlight,
} from "@suwatte/daisuke"

import {load, type Element } from "cheerio"
import { BASE_URL } from "./constants"

export default class Parser {
  parsePagedResponse(html:string): Highlight[]{
    const selector = "div.page-listing-item div.row div.col-6"
    const $ = load(html)
    const items = $(selector).toArray()
    const parseElement = (element: Element): Highlight => {
      const item = $("div div", element)
      const id = $("a", element)
        .attr("href")
        ?.trim()
        .match(/(?:webtoon)\/(.+)\//)?.[1]
      const cover = $("a img", item).attr("data-src")?.replace(/-\d+x\d+/g, "")
      const title = $("div.item-summary a", element).text()
      if(!id || !cover || !title) throw "Failed to Parse"
      return {
        id,
        cover,
        title
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
    const creators = $("div.author-content a").toArray().map(author => $(author).text())
    const summary = $("div.site-content div.summary__content p").text()
    const chapters = this.parseChapters(html)

    if(!title || !cover) throw "Couldn't parse"
    return {
      title,
      cover,
      summary,
      creators: creators,
      chapters,
      webUrl: `${BASE_URL}/webtoon/${contentId}`,
    }
  }
  parseChapters(html: string): Chapter[] {
    const $ = load(html)
    const chapterSelector = $("ul.main li").toArray().reverse()
    const chapters: Chapter[] = chapterSelector.map((chapter: Element, i) => {
      const response = {
        chapterId: $("a", chapter).attr("href")?.split("webtoon/")[1] ?? "",
        number: ++i,
        index: ++i,
        language: "EN",
        date: new Date($("i", chapter).text())
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
        url: 
          $(image).attr("src")?.trim() ??
          $(image).attr("data-src")?.trim()
      }
    })
    return pages
  }
}