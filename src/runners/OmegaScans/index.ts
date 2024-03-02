import {
  CatalogRating,
  Chapter,
  ChapterData,
  Content,
  ContentSource,
  DirectoryConfig,
  DirectoryRequest,
  FilterType,
  PagedResult,
  PublicationStatus,
  RunnerInfo,
} from "@suwatte/daisuke"
import { load } from "cheerio"

export class Target implements ContentSource {
  baseUrl = "https://omegascans.org"
  apiUrl = this.baseUrl.replace("//", "//api.")

  info: RunnerInfo = {
    id: "kusa.omegascans",
    name: "OmegaScans",
    thumbnail: "omega.png",
    version: 0.3,
    website: this.baseUrl,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.NSFW,
  }
  client = new NetworkClient()

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const genres = []

    if (request?.filters?.genres)
      genres.push(request.filters.genres.map((g: string) => Number(g)))

    const url = `${this.apiUrl}/query?query_string=${
      request.query ?? ""
    }&series_status=All&order=desc&orderBy=${
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
    const summary = jsonResponse.description
    const creators = [jsonResponse.author, jsonResponse.studio]
    const status =
      jsonResponse.status === "ongoing"
        ? PublicationStatus.COMPLETED
        : PublicationStatus.ONGOING
    const isNSFW = jsonResponse.adult
    const chapters: Chapter[] = []
    jsonResponse.seasons.forEach(
      (season: Record<string, Record<string, string>[]>) => {
        const seasonChapters: Chapter[] = []
        // TODO: fix
        season.chapters.forEach((chapter: any) => {
          if (chapter.price === 0)
            seasonChapters.push({
              chapterId: chapter.chapter_slug,
              title: chapter.chapter_name,
              number: Number(chapter.index.split(".")[0]),
              index:
                season.chapters.length - Number(chapter.index.split(".")[0]),
              language: "EN_US",
              date: new Date(chapter.created_at),
            })
        })
        chapters.push(...seasonChapters)
      },
    )
    const properties = []
    // TODO: some tag is giving a nil val
    properties.push({
      id: "genres",
      title: "Genres",
      tags: jsonResponse.tags.map((tag: Record<string, string>) => ({
        id: tag.id.toString(),
        title: tag.title,
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
      // properties,
    }
  }
  async getChapters(contentId: string): Promise<Chapter[]> {
    const response = await this.client.get(`${this.apiUrl}/series/${contentId}`)

    const jsonResponse = JSON.parse(response.data)
    const chapters: Chapter[] = []
    jsonResponse.seasons.forEach(
      (season: Record<string, Record<string, string>[]>) => {
        const seasonChapters: Chapter[] = []
        season.chapters.forEach((chapter: any) => {
          if (chapter.price === 0)
            seasonChapters.push({
              chapterId: chapter.chapter_slug,
              title: chapter.chapter_name,
              number: Number(chapter.index.split(".")[0]),
              index:
                season.chapters.length - Number(chapter.index.split(".")[0]),
              language: "EN_US",
              date: new Date(chapter.created_at),
            })
        })
        chapters.push(...seasonChapters)
      },
    )

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
