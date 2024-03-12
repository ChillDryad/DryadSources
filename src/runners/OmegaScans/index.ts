// TODO: remove below when types are better defined
/* eslint-disable @typescript-eslint/no-explicit-any */
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
} from "@suwatte/daisuke"
import { load } from "cheerio"

export class Target implements ContentSource {
  baseUrl = "https://omegascans.org"
  apiUrl = this.baseUrl.replace("//", "//api.")

  info: RunnerInfo = {
    id: "kusa.omegascans",
    name: "OmegaScans",
    thumbnail: "omega.png",
    version: 1.0,
    website: this.baseUrl,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.NSFW,
  }
  client = new NetworkClient()

  async getSectionsForPage(page: PageLink): Promise<PageSection[]> {
    if (page.id === "home")
      return [
        {
          id: "featured",
          title: "Featured",
          style: SectionStyle.GALLERY,
        },
        {
          id: "top",
          title: "Most Popular",
          style: SectionStyle.GALLERY,
        },
      ]
    else throw new Error("You see nothing here.")
  }

  async resolvePageSection(
    link: PageLink,
    section: string,
  ): Promise<ResolvedPageSection> {
    if (link.id === "home") {
      let url = this.apiUrl
      switch (section) {
        case "featured":
          url = `${this.apiUrl}/series/banners`
          break
        case "top":
          url = `${this.apiUrl}/query?visibility%3DPublic&series_type%3DAll&order%3Ddesc&orderBy%3Dtotal_views&page%3D1&perPage%3D10`
          break
      }
      const response = await this.client.get(url)
      const jsonResponse =
        section === "featured"
          ? JSON.parse(response.data)
          : JSON.parse(response.data).data
      const highlights = jsonResponse.map((item: Record<string, string>) => ({
        id: item.series_slug,
        title: item.title,
        cover: item.thumbnail,
      }))
      return {
        items: highlights,
      }
    } else throw new Error(`Unable to create sections for ${link.id}`)
  }

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const genres = []

    if (request?.filters?.genres)
      genres.push(request.filters.genres.map((g: string) => Number(g)))

    const url = `${this.apiUrl}/query?query_string=${
      request.query ?? ""
    }&series_status=${request.filters?.status ?? "All"}&order=desc&orderBy=${
      request.sort?.id ?? "latest"
    }&series_type=Comic&page=${request.page}&perPage=12&tags_ids=[${genres}]`

    const response = await this.client.get(url)

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
      isLastPage: highlights.length < 12,
    }
  }
  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.get(`${this.apiUrl}/series/${contentId}`)

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
    const chapters: Chapter[] = []
    const seasons = jsonResponse.seasons
      .map((season: any) => season.chapters)
      .flat()
    let i = 0
    while (i < seasons.length) {
      const chapter = {
        chapterId: seasons[i].chapter_slug,
        title: seasons[i].chapter_title || seasons[i].chapter_name,
        number: Number(seasons[i].index) ?? i,
        index: i,
        language: "EN_US",
        date: new Date(seasons[i].created_at),
      }
      if (seasons[i].price === 0) chapters.push(chapter)
      i++
    }
    const properties = []
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
    const response = await this.client.get(`${this.apiUrl}/series/${contentId}`)

    const jsonResponse = JSON.parse(response.data)
    const chapters: Chapter[] = []
    const seasons = jsonResponse.seasons
      .map((season: any) => season.chapters)
      .flat()
    let i = seasons.length - 1
    while (i >= 0) {
      const chapter = {
        chapterId: seasons[i].chapter_slug,
        title: seasons[i].chapter_name,
        number: i + 1,
        index: i,
        language: "EN_US",
        date: new Date(seasons[i].created_at),
      }
      if (seasons[i].price === 0) chapters.push(chapter)
      i--
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
    const parsedPages = $("p.flex img").toArray()
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
          options: [
            { id: "1", title: "Romance" },
            { id: "2", title: "Drama" },
            { id: "3", title: "Fantasy" },
            { id: "4", title: "Hardcore" },
            { id: "5", title: "SM" },
            { id: "8", title: "Harem" },
            { id: "9", title: "Hypnosis" },
            { id: "10", title: "Novel Adaptation" },
            { id: "11", title: "Netori" },
            { id: "12", title: "Netorare" },
            { id: "13", title: "Isekai" },
            { id: "14", title: "Yuri" },
            { id: "16", title: "MILF" },
            { id: "17", title: "Office" },
            { id: "18", title: "Short Story" },
            { id: "19", title: "Comedy" },
            { id: "20", title: "Campus" },
            { id: "21", title: "Crime" },
            { id: "22", title: "Revenge" },
            { id: "23", title: "Supernatural" },
            { id: "24", title: "Action" },
            { id: "25", title: "Military" },
            { id: "26", title: "Ability" },
            { id: "27", title: "Cohabitation" },
            { id: "28", title: "Training" },
          ],
        },
        {
          id: "status",
          title: "Status",
          type: FilterType.SELECT,
          options: [
            { id: "All", title: "All" },
            { id: "Ongoing", title: "Ongoing" },
            { id: "Completed", title: "Completed" },
            { id: "Hiatus", title: "Hiatus" },
            { id: "Canceled", title: "Canceled" },
            { id: "Dropped", title: "Dropped" },
          ],
        },
      ],
      sort: {
        options: [
          { id: "title", title: "title" },
          { id: "total_views", title: "total_views" },
          { id: "latest", title: "latest" },
          { id: "created_at", title: "created_at" },
        ],
        canChangeOrder: false,
        default: {
          id: "latest",
        },
      },
    }
  }
}
