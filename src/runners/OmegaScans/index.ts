import {
  CatalogRating,
  type Chapter,
  type ChapterData,
  type Content,
  type ContentSource,
  type DirectoryConfig,
  type DirectoryRequest,
  FilterType,
  type PageLink,
  type PageSection,
  type PagedResult,
  PublicationStatus,
  type ResolvedPageSection,
  type RunnerInfo,
  SectionStyle,
  ReadingMode,
  type Property,
} from "@suwatte/daisuke"
import { load } from "cheerio"
import { GENRES, SORTS, STATUS } from "./constants"

const PER_PAGE = 12

export class Target implements ContentSource {
  baseUrl = "https://omegascans.org"
  apiUrl = this.baseUrl.replace("://", "://api.")

  info: RunnerInfo = {
    id: "kusa.omegascans",
    name: "OmegaScans",
    thumbnail: "omega.png",
    version: 1.4,
    website: this.baseUrl,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.NSFW,
  }
  client = new NetworkClient()

  async getSectionsForPage(page: PageLink): Promise<PageSection[]> {
    if (page.id === "home")
      return [
        {
          id: "top",
          title: "Most Popular",
          style: SectionStyle.GALLERY,
        },
        {
          id: "latest",
          title: "Latest Update",
          style: SectionStyle.GALLERY,
        },
        {
          id: "newest",
          title: "Newest",
          style: SectionStyle.GALLERY,
        },
        {
          id: "completed",
          title: "Completed",
          style: SectionStyle.PADDED_LIST,
        },
      ]
    else throw new Error("You see nothing here.")
  }

  async resolvePageSection(
    link: PageLink,
    section: string,
  ): Promise<ResolvedPageSection> {
    if (link.id === "home") {
      const params: Record<
        string,
        string | string[] | boolean | undefined | number
      > = {
        adult: true,
      }
      switch (section) {
        case "top":
          params.orderBy = "total_views"
          params.status = "All"
          break
        case "latest":
          params.orderBy = "latest"
          params.status = "All"
          break
        case "newest":
          params.orderBy = "created_at"
          params.status = "All"
          break
        case "completed":
          params.orderBy = "latest"
          params.status = "Completed"
          break
      }
      const response = await this.client.get(`${this.apiUrl}/query`, { params })
      const jsonResponse = JSON.parse(response.data)
      const highlights = jsonResponse.data.map(
        (item: Record<string, string>) => ({
          id: item.series_slug,
          title: item.title,
          cover: item.thumbnail,
        }),
      )
      return {
        items: highlights,
      }
    } else throw new Error(`Unable to create sections for ${link.id}`)
  }

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const params: Record<
      string,
      string | string[] | boolean | undefined | number
    > = {}
    const genres = []

    if (request?.filters?.genres)
      genres.push(request.filters.genres.map((g: string) => Number(g)))

    params.page = request.page
    params.query_string = request?.query
    params.status = request?.filters?.status ?? "All"
    if (genres.length) params.tags_ids = `[${genres.join(",")}]`
    params.order = "desc"
    params.orderBy = request?.sort?.id ?? "latest"
    params.series_type = "Comic"
    params.perPage = PER_PAGE
    params.adult = true

    const response = await this.client.get(`${this.apiUrl}/query`, {
      params,
    })
    const jsonResponse = JSON.parse(response.data)
    const highlights = jsonResponse.data.map(
      (item: Record<string, string>) => ({
        id: item.series_slug,
        title: item.title,
        cover: item.thumbnail,
      }),
    )
    return {
      results: highlights,
      isLastPage: highlights.length < PER_PAGE,
    }
  }

  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.get(`${this.apiUrl}/series/${contentId}`)

    const jsonResponse = JSON.parse(response.data)
    const title = jsonResponse.title
    const cover = jsonResponse.thumbnail
    const $ = load(jsonResponse.description)
    const summary = $("p").text()
    const creators = [jsonResponse.author, jsonResponse.studio].filter(Boolean)
    const status =
      Number(PublicationStatus[jsonResponse.status.toUpperCase()]) ||
      PublicationStatus.ONGOING
    const isNSFW = jsonResponse.adult
    const chapters = await this.getChapters(jsonResponse.id.toString())
    const properties: Property[] = []
    if (creators.length > 0)
      properties.push({
        id: "creators",
        title: "Credits",
        tags: creators.map((c, i) => ({
          id: i.toString(),
          title: c,
          nsfw: false,
          noninteractive: false,
        })),
      })
    return {
      title,
      cover,
      summary,
      creators,
      status,
      isNSFW,
      chapters,
      properties,
      recommendedPanelMode: ReadingMode.WEBTOON,
      webUrl: `${this.baseUrl}/series/${contentId}`,
    }
  }
  async getChapters(contentId: string): Promise<Chapter[]> {
    const seriesId = /^\d+$/.test(contentId)
      ? contentId
      : (
          JSON.parse(
            (
              await this.client.get(`${this.apiUrl}/series/${contentId}`)
            ).data,
          ) as { id: number }
        ).id.toString()
    const response = await this.client.get(`${this.apiUrl}/chapter/query`, {
      params: {
        page: 1,
        perPage: 999,
        series_id: seriesId,
      },
    })
    const parsedChapters = JSON.parse(response.data)?.data ?? []
    const chapters: Chapter[] = []
    let i = 0
    while (i < parsedChapters.length) {
      const chapter = parsedChapters[i]
      if (chapter.price === 0) {
        const nameMatch = chapter.chapter_name?.match(/(\d+(\.\d+)?)/)
        const titleMatch = chapter.chapter_title?.match(/(\d+(\.\d+)?)/)
        const parsedNumber = Number(nameMatch?.[1] ?? titleMatch?.[1])
        chapters.push({
          chapterId: chapter.chapter_slug,
          title: chapter.chapter_title || chapter.chapter_name,
          number: Number.isFinite(parsedNumber)
            ? parsedNumber
            : i - parsedChapters.length,
          index: i,
          language: "EN_US",
          date: new Date(chapter.created_at),
        })
      }
      i++
    }

    return chapters
  }
  async getChapterData(
    contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const response = await this.client.get(
      `${this.baseUrl}/series/${contentId}/${chapterId}`,
    )
    const $ = load(response.data)
    const parsedPages = $("img.block.object-contain").toArray()
    const pages = parsedPages
      .map((page) => {
        const url =
          $(page).attr("data-src")?.trim() ||
          $(page).attr("src")?.trim() ||
          undefined
        return url ? { url } : null
      })
      .filter((p): p is { url: string } => p !== null)
    return { pages }
  }
  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {
      filters: [
        {
          id: "genres",
          title: "Genres",
          type: FilterType.MULTISELECT,
          options: GENRES,
        },
        {
          id: "status",
          title: "Status",
          type: FilterType.SELECT,
          options: STATUS,
        },
      ],
      sort: {
        options: SORTS,
        canChangeOrder: false,
        default: {
          id: "latest",
        },
      },
    }
  }
}
