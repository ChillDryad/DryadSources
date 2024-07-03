import { type Element, load } from "cheerio"
import { BASE } from "./constants"
import {
  PublicationStatus,
  type Property,
  Chapter,
  ChapterPage,
  Highlight,
  ReadingMode,
} from "@suwatte/daisuke"

export class Parser {
  parseDirectory(html: string) {
    const $ = load(html)

    const entries = $("div.content div.section").toArray()
    const highlights: Highlight[] = []

    let i = 0
    while (i < entries.length) {
      const title = $("div.info p", entries[i])
        .text()
        .replace(/^\s+|\s+$/g, "")
      const cover = `${BASE}${$("img", entries[i]).attr("src")}`
      const id = $("a", entries[i]).attr("href")

      if (title && cover && id) highlights.push({ title, cover, id })
      i++
    }
    return highlights
  }
  parseComic(html: string) {
    const $ = load(html)

    let status = PublicationStatus.ONGOING
    const title = $("div.content div.content_top div.heading")
      .first()
      .text()
      .trim()
    const cover = `${BASE}${$("div.content div.section div.cover img").attr(
      "src",
    )}`
    const chapters = this.parseChapters(html)
    const creators: string[] = []

    const properties: Property[] = []
    for (const item of $("div.content div.section div.info p").toArray()) {
      const contents = $("span", item).text().trim()
      const tags = []
      if (contents.includes("Genre")) {
        tags.push(
          ...$("a", item)
            .toArray()
            .map((genre) => {
              const title = $(genre).text()
              return { id: title, title }
            }),
        )
        if (tags.length > 0)
          properties.push({
            id: "genres",
            title: "Genres",
            tags,
          })
      }
      if (contents.includes("Status")) {
        if ($(item).text().includes("Completed"))
          status = PublicationStatus.COMPLETED
      }
      if (
        contents.includes("Publisher") ||
        contents.includes("Artist") ||
        contents.includes("Writer")
      ) {
        creators.push($("a", item).text())
      }
    }

    if (creators.length > 0)
      properties.push({
        id: "credits",
        title: "Credits",
        tags: creators.map((creator) => ({
          id: creator,
          title: creator,
          noninteractive: true,
        })),
      })

    return {
      title,
      cover,
      properties,
      status,
      chapters,
      recommendedPanelMode: ReadingMode.PAGED_COMIC,
    }
  }
  /**
   * Credit to xOnlyFadi's Paperback source.
   * https://github.com/xOnlyFadi/xonlyfadi-extensions/blob/0.8/src/ReadComicOnline/ReadComicOnlineParser.ts#L82
   */
  parsePages(data: string) {
    const pages: ChapterPage[] = []
    const imageMatches = data.matchAll(/lstImages\.push\(['"](.*)['"]\)/gi)
    console.log(imageMatches)
    for (const match of imageMatches) {
      if (!match[1]) continue

      let url = match[1]
        .replace(/_x236/g, "d")
        .replace(/_x945/g, "g")
        .replace(/pw_.g28x/g, "b")
        .replace(/d2pr.x_27/g, "h")

      if (url.startsWith("https")) {
        pages.push({ url })
      } else {
        const sliced = url.slice(url.indexOf("?"))
        const containsS0 = url.includes("=s0")
        url = url.slice(
          0,
          containsS0 ? url.indexOf("=s0?") : url.indexOf("=s1600?"),
        )
        url = url.slice(
          0,
          containsS0 ? url.indexOf("=s0?") : url.indexOf("=s1600?"),
        )
        url = url.slice(4, 22) + url.slice(25)
        url = url.slice(0, -6) + url.slice(-2)
        url = Buffer.from(url, "base64").toString("utf-8")
        url = url.slice(0, 13) + url.slice(17)
        url = url.slice(0, -2) + (containsS0 ? "=s0" : "=s1600")
        pages.push({ url: `https://2.bp.blogspot.com/${url + sliced}` })
      }
    }
    console.log(pages)
    return pages
  }
  parseChapters(html: string) {
    const $ = load(html)

    const chapterList: Element[] = $("ul.list li").toArray()
    const chapters: Chapter[] = []
    let i = 0
    while (i < chapterList.length) {
      const chapterId = $("div.col-1 a", chapterList[i]).attr("href")
      if (chapterId === undefined)
        throw `Failed to parse ${i} of ${$(
          "div.content div.content_top div.heading",
        )
          .text()
          .trim()}`
      const chapter = {
        chapterId,
        date: new Date($("div.col-2 span", chapterList[i]).text()),
        title: $("div.col-1 span", chapterList[i]).text().trim(),
        number:
          Number($("div.col-1", chapterList[i]).text()?.split("#")?.[1]) ||
          i + 1,
        index: i,

        language: "EN_US",
      }
      chapters.push(chapter)
      i++
    }
    return chapters
  }
}
