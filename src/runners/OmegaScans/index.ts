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
import { HeanChapter } from "./types"

export class Target implements ContentSource {
  baseUrl = "https://omegascans.org"
  apiUrl = this.baseUrl.replace("//", "//api.")

  info: RunnerInfo = {
    id: "kusa.omegascans",
    name: "OmegaScans",
    thumbnail: "omega.png",
    version: 1.2,
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
      const jsonResponse = JSON.parse(response.data).data
      const highlights = jsonResponse.map((item: Record<string, string>) => ({
        id: item.id.toString(),
        title: item.title,
        cover: item.thumbnail,
      }))
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
    params.status = request?.filters?.status
    params.tags_ids = `[${genres.join(",")}]`
    params.orderBy = request?.sort?.id ?? "latest"
    params.adult = true

    const response = await this.client.get(`${this.apiUrl}/query`, {
      params,
    })
    const jsonResponse = JSON.parse(response.data)
    const highlights = jsonResponse.data.map(
      (item: Record<string, string>) => ({
        id: item.id.toString(),
        title: item.title,
        cover: item.thumbnail,
      }),
    )
    return {
      results: highlights,
      isLastPage: highlights.length < 12,
    }
  }

  async getSeriesSlug(contentId: string) {
    const seriesSlug = await this.client.get(`${this.apiUrl}/chapter/query`, {
      params: { page: 1, perPage: 1, series_id: contentId },
    })
    const slug = JSON.parse(seriesSlug.data).data?.[0].series.series_slug

    if (slug === undefined) throw `Could not parse ${contentId}`
    return slug
  }

  async getContent(contentId: string): Promise<Content> {
    // TODO: remove this when context is enabled.
    const slug = await this.getSeriesSlug(contentId)
    const response = await this.client.get(`${this.apiUrl}/series/${slug}`)

    const jsonResponse = JSON.parse(response.data)
    const title = jsonResponse.title
    const cover = jsonResponse.thumbnail
    const $ = load(jsonResponse.description)
    const summary = $("p").text()
    const creators = [jsonResponse.author, jsonResponse.studio]
    const status =
      Number(PublicationStatus[jsonResponse.status.toUpperCase()]) ||
      PublicationStatus.ONGOING
    const isNSFW = jsonResponse.adult
    const chapters = await this.getChapters(jsonResponse.id)
    const properties: Property[] = []
    if (jsonResponse.tags.length > 0)
      properties.push({
        id: "genres",
        title: "Genres",
        tags: jsonResponse.tags.map((tag: Record<string, string>) => ({
          id: tag.id.toString(),
          title: tag.name,
        })),
      })
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
    const response = await this.client.get(`${this.apiUrl}/chapter/query`, {
      params: {
        page: 1,
        perPage: 999,
        series_id: contentId,
      },
    })
    const parsedChapters = JSON.parse(response.data)?.data
    const chapters: Chapter[] = []
    let i = 0
    while (i < parsedChapters.length) {
      const chapter = parsedChapters[i]
      if (chapter.price === 0)
        chapters.push({
          chapterId: chapter.chapter_slug,
          title: chapter.chapter_title || chapter.chapter_name,
          number:
            Number(chapter.chapter_name.match(/(\d+(\.\d+)?)/)?.[1]) ??
            Number(chapter.chapter_title.match(/(\d+(\.\d+)?)/)?.[1]) ??
            i - parsedChapters.length,
          index: i,
          language: "EN_US",
          date: new Date(chapter.created_at),
        })
      i++
    }

    return chapters
  }
  async getChapterData(
    contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const slug = await this.getSeriesSlug(contentId)
    const response = await this.client.get(
      `${this.baseUrl}/series/${slug}/${chapterId}`,
    )
    const $ = load(response.data)
    const parsedPages = $("div.flex img").toArray()
    const pages = parsedPages.map((page) => {
      const url =
        // @ts-expect-error this will exist
        $(page).attr("data-src")?.trim().length > 1
          ? $(page).attr("data-src")?.trim()
          : $(page).attr("src")?.trim()
      return {
        url,
      }
    })
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
