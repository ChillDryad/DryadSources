import {
  type Tag,
  type Property,
  type Chapter,
  PublicationStatus,
} from "@suwatte/daisuke"
import { type Element, load, type CheerioAPI } from "cheerio"

import { AES, enc, pad } from "crypto-js"
import { ADULT } from "./constants"

export class Parser {
  parseSearch(html: string) {
    const $ = load(html)
    const entries = $("div.pic_list div.flex1").toArray()
    const highlights = entries.map((entry: Element) => {
      const title = $("span.title", entry).text().trim()
      const cover = $("a img", entry)
        .attr("data-src")
        ?.trim()
        .replace(/i\d+/, "i9")
      const id = $("a", entry).attr("href")?.split("/read-manga/")[1].trim()

      if (id && title && cover)
        return {
          id,
          title,
          cover,
        }
      throw "Failed to Parse"
    })
    return highlights
  }
  parseQuery(html: string) {
    const $ = load(html)
    const results = $("ul#search_list li").toArray()

    const highlights = results.map((result: Element) => {
      const title = $("h2", result).text().trim()
      const cover = $("img", result).attr("src")?.trim().replace(/i\d+/, "i9")
      const id = $("h2 a", result).attr("href")?.split("/read-manga/")[1].trim()
      if (id && title && cover)
        return {
          id,
          title,
          cover,
        }
      throw "failed to parse"
    })
    return highlights
  }
  parseManga(html: string, contentId: string) {
    let isNSFW: boolean = false

    const $ = load(html)
    const title = $("div.w-title h1").text().trim()
    const cover = $("div.cover img")
      .attr("src")
      ?.trim()
      .replace(/i\d+/, "i9")
      .trim()
    const creators: string[] = []
    const properties: Property[] = []
    const information = $("table.left tbody tr").toArray()
    const summary = $("div.manga_summary").text().trim()
    let status = PublicationStatus.ONGOING

    information.forEach((property) => {
      let tags: Tag[]
      const section = $("td label", property).text().trim()

      switch (section) {
        case "Genre(s):":
          if ($("a", property).toArray().length > 1) {
            tags = $("a", property)
              .toArray()
              .map((genre) => {
                const title = $(genre).text()
                if (!isNSFW) {
                  isNSFW = ADULT.some((t) => t.id === title)
                }
                return {
                  id: title,
                  title,
                }
              })
            properties.push({
              id: "genres",
              title: "Genres",
              tags,
            })
          }
          break
        case "Author:":
          creators.push($("a", property).text().trim())
          break
        case "Status:":
          status =
            $("span", property).text().trim() === "Completed"
              ? PublicationStatus.COMPLETED
              : PublicationStatus.ONGOING
          break
      }
    })

    const chapterList = $("table#chapter_table tbody tr").toArray()
    const chapters = this.arrayToChapters($, chapterList, contentId)
    if (creators.length > 1)
      properties.push({
        id: "authors",
        title: "Credits",
        tags: creators.map((creator) => ({
          id: creator,
          title: creator,
          noninteractive: true,
        })),
      })
    if (title && cover)
      return {
        title,
        cover,
        chapters,
        summary,
        properties,
        status,
        isNSFW,
      }
    else throw `Failed to parse ${contentId}`
  }
  parseChapters(html: string, contentId: string) {
    const $ = load(html)
    const chapterList = $("table#chapter_table tbody tr").toArray()
    const chapters = this.arrayToChapters($, chapterList, contentId)
    return chapters
  }
  parsePages(html: string) {
    const $ = load(html)
    const images = $("script:contains('imgsrcs')").html()

    const imgSrcs = images?.split(";")[0].split("=")[1]
    if (imgSrcs === undefined) throw "Failed to find SRCs"

    return this.decodeImages(imgSrcs.replaceAll(/'/g, "").trim())
  }

  /**
   * UTILS
   */
  arrayToChapters = (
    $: CheerioAPI,
    chapterList: Element[],
    contentId: string,
  ): Chapter[] => {
    const chapters: Chapter[] = []
    for (let i = 0; i < chapterList.length; i++) {
      const chapterId = $("a", chapterList[i]).attr("href")?.split(contentId)[1]
      const title = $("h4 a", chapterList[i]).text().trim()
      const date = $("td.no").last().text()
      if (chapterId === undefined)
        throw `Could not parse chapter ${i} for ${contentId}`

      const chapter = {
        chapterId,
        title,
        number: chapterList.length - i,
        index: i,
        language: "EN_US",
        date: new Date(date),
      }
      chapters.push(chapter)
    }
    return chapters
  }
  // If something breaks, it's probably here.
  // If it breaks & MangaGo still uses SoJSONv4 see following message in Suwatte Disc
  // https://discord.com/channels/1011425930897534997/1011426179892396134/1215402669221617754
  decodeImages(srcs: string) {
    const key = enc.Hex.parse("e11adc3949ba59abbe56e057f20f883e")
    const iv = enc.Hex.parse("1234567890abcdef1234567890abcdef")
    const opinion = { iv, padding: pad.ZeroPadding }
    const images = AES.decrypt(srcs, key, opinion).toString(enc.Utf8)

    return images.split(",").map((image) => ({
      url: image,
    }))
  }
}
