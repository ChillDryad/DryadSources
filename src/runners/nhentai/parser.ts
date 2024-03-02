import type { ChapterPage, Content, Property } from "@suwatte/daisuke"
import { load } from "cheerio"
export class Parser {
  parsePagedResponse(html: string) {
    const selector = "div.container div.gallery"
    const $ = load(html)
    const items = $(selector).toArray()
    const highlights = items.map((item) => {
      const id = $("a", item).attr("href")?.split("/g/")[1]
      const cover = $("a img", item).attr("data-src")
      const title = $("a div.caption", item).text()
      if (!id || !cover || !title) throw "Failed to parse"
      return {
        id,
        cover,
        title,
      }
    })
    return highlights
  }

  parseContent(html: string, _contentId: string): Content {
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
    if (!title || !cover) throw "Could not parse"
    return {
      title,
      cover,
      properties,
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
        url: `https://i.nhentai.net/galleries/${id}/${i + 1}.${
          type[type.length - 1]
        }`,
      }
    })
    return pages
  }
}
