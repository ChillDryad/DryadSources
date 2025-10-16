import type { ChapterPage, Content, Property } from "@suwatte/daisuke"
import { load } from "cheerio"
import { LANGUAGES } from "./constants"
export class Parser {
  parsePagedResponse(html: string) {
    const selector = "div.container div.gallery"
    const $ = load(html)
    const items = $(selector).toArray()
    const highlights = items.map((item) => {
      const id = $("a", item).attr("href")?.split("/g/")[1]
      const cover = $("a img", item).attr("data-src")
      const title = $("a div.caption", item).text()
      const language = LANGUAGES.filter((l) => {
        if ($(item).attr("data-tags")?.includes(l.id)) return l.code
      })[0]
      if (!id || !cover || !title) throw "Failed to parse"
      return {
        id,
        cover: `https:${cover}`,
        title: `${language?.flag ?? ""} ${title}`,
        language: language?.code ?? "Unknown",
      }
    })
    return highlights
  }

  parseContent(html: string, contentId: string): Content {
    const $ = load(html)
    const containers = $("div.tag-container").toArray()

    const properties: Property[] = []
    containers.map((container) => {
      const name = $(container).text().trim()
      if (name.includes("Tags:")) {
        const genres = $("span.tags a span.name", container).toArray()
        const res = genres.map((genre) => ({
          id: $(genre).text().replace(" ", "-"),
          title: $(genre).text(),
        }))
        properties.push({
          id: name.toLowerCase(),
          title: name,
          tags: res,
        })
      }
    })

    const title = $("div#info h1.title").text()
    const cover = $("div#cover a img").attr("data-src")
    const chapter = {
      chapterId: contentId.split("/")[0],
      number: 1,
      index: 1,
      date: new Date(),
      language: "EN_GB",
    }
    if (!title || !cover) throw "Could not parse"
    return {
      title,
      cover: `https:${cover}`,
      properties,
      chapters: [chapter],
    }
  }
  parsePages(html: string): ChapterPage[] {
    const $ = load(html)
    const images = $(
      "div#thumbnail-container div.thumb-container a.gallerythumb",
    ).toArray()
    const pages = images.map((img, i) => {
      const type = $("img", img).attr("data-src")?.split(".")
      const id = $("img", img)
        .attr("data-src")
        ?.split("galleries/")[1]
        .split("/")[0]

      if (!type) throw "Couldn't parse"
      return {
        url: `https://i4.nhentai.net/galleries/${id}/${i + 1}.${
          type[type.length - 1]
        }`,
      }
    })
    return pages
  }
}
