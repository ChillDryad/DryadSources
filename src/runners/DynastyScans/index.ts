import {
  CatalogRating,
  type Chapter,
  type ChapterData,
  type Content,
  type DirectoryConfig,
  type DirectoryRequest,
  type Highlight,
  type PagedResult,
  type RunnerInfo,
  type ContentSource,
  NetworkClientBuilder,
} from "@suwatte/daisuke"

import { BASE_URL } from "./constants"
import { load } from "cheerio"

type DynastyTags = {
  type: string
  name: string
  permalink: string
}
interface DynastyHeaderTagging {
  kind: "header"
  header: string
}
interface DynastyChapterTagging {
  kind: "chapter"
  title: string
  permalink: string
  released_on: string
  tags: DynastyTags[]
}
type DynastyMangaResponse = {
  name: string
  type: string
  permalink: string
  tags: DynastyTags[]
  cover: string
  description: string | null
  aliases: string[]
  taggings: DynastyChapterTagging[] | DynastyHeaderTagging[]
}

export class Target implements ContentSource {
  info: RunnerInfo = {
    id: "kusa.dynastyscans",
    name: "Dynasty Scans",
    thumbnail: "dynasty.png",
    version: 0.3,
    website: BASE_URL,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.MIXED,
  }

  limitedClient = new NetworkClientBuilder().setRateLimit(10, 5).build()
  client = new NetworkClient()

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const params: Record<string, string | string[] | number> = {}

    if (request?.filters?.genres) {
      const included: string[] = []
      const excluded: string[] = []
      for (const filter in request.filters) {
        included.push(...(request.filters[filter].included || []))
        excluded.push(...(request.filters[filter].excluded || []))
      }
      params.with = included.map((g: string) => `&with[]=${g}`)
      params.without = excluded.map((g: string) => `&without[]=${g}`)
    }

    params.page = request.page
    params.q = request.query ?? ""
    params["classes[]"] = "Series"
    params["classes[]"] = "Anthology"

    const response = await this.client.get(`${BASE_URL}/search`, { params })

    const $ = load(response.data)
    const titles = $("dl.chapter-list dd").toArray()
    const results: Highlight[] = []
    for (const title of titles) {
      const details = await this.limitedClient.get(
        `${BASE_URL}${$("a.name", title).attr("href")}.json`,
      )
      const parsedDetails: {
        name: string
        permalink: string
        type: string
        cover: string
      } = JSON.parse(details.data)
      results.push({
        id: `${parsedDetails.type === "Anthology" ? "anthologies" : "series"}/${
          parsedDetails.permalink
        }`,
        title: parsedDetails.name,
        cover: `${BASE_URL}${parsedDetails.cover}`,
      })
    }
    return {
      results,
      isLastPage: results.length < 20,
    }
  }

  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.get(`${BASE_URL}/${contentId}.json`)
    const details: {
      name: string
      tags: DynastyTags[]
      cover: string
      description?: string
    } = JSON.parse(response.data)
    return { title: details.name, cover: `${BASE_URL}${details.cover}` }
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    const response = await this.client.get(`${BASE_URL}/${contentId}.json`)
    const details: DynastyMangaResponse = JSON.parse(response.data)
    // let volume = ""
    const chapters: Chapter[] = []
    for (const entry in details.taggings.reverse()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const current: any = details.taggings[entry]

      if (current?.title !== undefined) {
        const newChapter = {
          chapterId: current.permalink,
          title: current.title,
          number:
            Number(current.title.match(/chapter \d+/gi)?.[0].match(/\d+/)[0]) ||
            0,
          index: Number(entry),
          // volume: Number(volume),
          date: new Date(current.released_on),
          language: "en_us",
        }

        chapters.push(newChapter)
      }
    }
    return chapters
  }
  async getChapterData(
    _contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const response = await this.client.get(
      `${BASE_URL}/chapters/${chapterId}.json`,
    )
    const details: {
      pages: {
        name: string
        url: string
      }[]
    } = JSON.parse(response.data)

    const pages = details.pages.map((page) => ({
      url: `${BASE_URL}${page.url}`,
    }))

    return { pages }
  }
  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {}
  }
}
