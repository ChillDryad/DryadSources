import type { Chapter, Content, Property, Tag } from "@suwatte/daisuke"
import { load } from "cheerio"
import { PublicationStatus } from "@suwatte/daisuke"

export function parseHighlights(html: string, baseUrl: string) {
  const $ = load(html)
  const results: { id: string; title: string; cover: string }[] = []

  $("div.post").each((_, el) => {
    const anchor = $(el).find("h6 a").first()
    const title = anchor.text().trim()
    const href = anchor.attr("href") ?? ""
    const cover =
      $(el).find("img").attr("src") ??
      $(el).find("img").attr("data-src") ??
      ""

    const id = href
      .replace(baseUrl, "")
      .replace(/^\/|\/$/g, "")

    if (title && id) {
      results.push({ id, title, cover })
    }
  })

  return results
}

export function parseContent(
  html: string,
  baseUrl: string,
): Omit<Content, "chapters"> {
  const $ = load(html)

  const title = $("h1").first().text().trim()
  const cover =
    $("div.post-type-single-column img.wp-post-image").attr("src") ??
    $("div.post-type-single-column img.wp-post-image").attr("data-src")

  const summaryParts: string[] = []
  $("div.card-body")
    .filter((_, el) => $(el).find("h5").text().toLowerCase().includes("synopsis"))
    .find("p")
    .each((_, p) => {
      const text = $(p).text().trim()
      if (text) summaryParts.push(text)
    })

  const properties: Property[] = []

  const genreTags: Tag[] = []
  $("a[href*=genres]").each((_, el) => {
    const name = $(el).text().trim()
    if (name)
      genreTags.push({ id: name.toLowerCase().replace(/\s+/g, "-"), title: name })
  })
  if (genreTags.length) {
    properties.push({ id: "genres", title: "Genres", tags: genreTags })
  }

  const artistText = $("tr:has(th:contains('Artist')) > td")
    .first()
    .text()
    .trim()
  if (artistText) {
    properties.push({
      id: "creators",
      title: "Credits",
      tags: [
        {
          id: artistText.toLowerCase().replace(/\s+/g, "-"),
          title: artistText,
          noninteractive: true,
        },
      ],
    })
  }

  const statusText = $("tr:has(th:contains('Status')) > td")
    .first()
    .text()
    .trim()
    .toLowerCase()

  let status = PublicationStatus.ONGOING
  if (statusText.includes("hiatus")) status = PublicationStatus.HIATUS
  else if (statusText.includes("completed")) status = PublicationStatus.COMPLETED

  return {
    title,
    cover,
    summary: summaryParts.join("\n") || undefined,
    status,
    properties,
    webUrl: "",
  }
}

export function parseChapterPage(
  html: string,
  baseUrl: string,
  indexOffset: number,
): { chapters: Chapter[]; hasMore: boolean } {
  const $ = load(html)
  const chapters: Chapter[] = []

  $(".chapter-list-row:has(.chapter-cell)").each((i, el) => {
    const anchor = $(el).find("a.seenchapter").first()
    const title = anchor.text().trim()
    const href = anchor.attr("href") ?? ""
    const chapterId = href.replace(baseUrl, "") || href

    const dateText = $(el).find(".chapter-date").text().trim()
    const date = dateText ? new Date(dateText) : new Date(0)

    chapters.push({
      chapterId,
      title,
      number: parseChapterNumber(title, indexOffset + i),
      index: indexOffset + i,
      date,
      language: "EN_US",
    })
  })

  const hasMore = $("a.page-link:contains('Next')").length > 0

  return { chapters, hasMore }
}

export function parsePages(html: string): { url: string }[] {
  const $ = load(html)
  return $(".manga-child-the-content img")
    .map((_, el) => {
      const url = $(el).attr("src") ?? $(el).attr("data-src") ?? ""
      return { url }
    })
    .get()
    .filter((p) => p.url)
}

export function parseFilterOptions(
  html: string,
): { id: string; title: string; options: Tag[] }[] {
  const $ = load(html)
  const scriptData = $("script")
    .filter((_, el) => $(el).html()?.includes("FWP_JSON") ?? false)
    .first()
    .html() ?? ""

  if (!scriptData) return []

  const filterDefs = [
    { id: "_genres", title: "Genres", field: "genres" },
    { id: "_mtype", title: "Type", field: "mtype" },
    { id: "_status", title: "Status", field: "status" },
    { id: "_sort_posts", title: "Sort By", field: "sort_posts" },
    { id: "_movies_series_year", title: "Year", field: "movies_series_year" },
  ]

  const results: { id: string; title: string; options: Tag[] }[] = []

  for (const def of filterDefs) {
    const pattern = new RegExp(`"${def.field}":("(?:\\\\.|[^"\\\\])*")`)
    const match = pattern.exec(scriptData)
    if (!match) continue

    let fragment: string
    try {
      fragment = JSON.parse(match[1]) as string
    } catch {
      continue
    }

    const $frag = load(fragment)
    const options: Tag[] = []

    $frag("option").each((_, el) => {
      const value = $frag(el).attr("value") ?? ""
      const text = $frag(el)
        .text()
        .trim()
        .replace(/\(\d+\)\s*$/, "")
        .trim()
      const title =
        text.charAt(0).toUpperCase() + text.slice(1)
      if (value && title) {
        options.push({ id: value, title })
      }
    })

    if (options.length) {
      results.push({ id: def.id, title: def.title, options })
    }
  }

  return results
}

function parseChapterNumber(title: string, fallback: number): number {
  const match = title.match(/chapter\s+(\d+(?:\.\d+)?)/i)
  return match ? parseFloat(match[1]) : fallback
}
