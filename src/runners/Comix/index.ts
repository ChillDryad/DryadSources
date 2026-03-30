import {
  CatalogRating,
  type Chapter,
  type ChapterData,
  type Content,
  type ContentSource,
  type DirectoryConfig,
  type DirectoryRequest,
  FilterType,
  type ImageRequestHandler,
  type NetworkRequest,
  type PageLink,
  type PageSection,
  type PagedResult,
  PublicationStatus,
  type Property,
  type ResolvedPageSection,
  type RunnerInfo,
  ReadingMode,
  SectionStyle,
} from "@suwatte/daisuke"
import { DEMOGRAPHICS, GENRES, SORTS, STATUSES, TYPES } from "./constants"
import {
  type ChapterImagesResponse,
  type ChapterListResponse,
  type ComixChapter,
  type ComixManga,
  type SearchResponse,
  type SingleMangaResponse,
} from "./types"

export class Target implements ContentSource, ImageRequestHandler {
  baseUrl = "https://comix.to"
  apiUrl = "https://comix.to/api/v2"

  info: RunnerInfo = {
    id: "kusa.comix",
    name: "Comix",
    thumbnail: "comix.png",
    version: 1.0,
    website: "https://comix.to",
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.MIXED,
    minSupportedAppVersion: "5.0",
  }

  client = new NetworkClient()

  // ImageRequestHandler — add Referer for images
  async willRequestImage(url: string): Promise<NetworkRequest> {
    return {
      url,
      headers: { referer: `${this.baseUrl}/` },
    }
  }

  async getSectionsForPage(page: PageLink): Promise<PageSection[]> {
    if (page.id !== "home") throw new Error("Page not found")
    return [
      { id: "popular", title: "Most Popular", style: SectionStyle.GALLERY },
      { id: "latest", title: "Latest Updated", style: SectionStyle.GALLERY },
      { id: "new", title: "New Releases", style: SectionStyle.PADDED_LIST },
    ]
  }

  async resolvePageSection(
    link: PageLink,
    sectionID: string,
  ): Promise<ResolvedPageSection> {
    if (link.id !== "home") throw new Error(`Unknown page: ${link.id}`)

    const orderMap: Record<string, string> = {
      popular: "views_30d",
      latest: "chapter_updated_at",
      new: "created_at",
    }
    const order = orderMap[sectionID]
    if (!order) throw new Error(`Unknown section: ${sectionID}`)

    const url = `${this.apiUrl}/manga?order[${order}]=desc&limit=20&page=1`
    const response = await this.client.get(url)
    const data: SearchResponse = JSON.parse(response.data)
    return {
      items: data.result.items.map(mangaToHighlight),
    }
  }

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    let queryString = ""

    const { genres, status, type, demographic } = request.filters ?? {}

    if (genres) {
      const { included, excluded } = genres as {
        included?: string[]
        excluded?: string[]
      }
      if (included)
        queryString += "&" + included.map((v) => `genres[]=${v}`).join("&")
      if (excluded)
        queryString += "&" + excluded.map((v) => `genres[]=-${v}`).join("&")
    }

    if (status)
      queryString +=
        "&" + (status as string[]).map((v) => `statuses[]=${v}`).join("&")

    if (type)
      queryString +=
        "&" + (type as string[]).map((v) => `types[]=${v}`).join("&")

    if (demographic)
      queryString +=
        "&" +
        (demographic as string[]).map((v) => `demographics[]=${v}`).join("&")

    if (request.query) {
      queryString += `&keyword=${encodeURIComponent(request.query)}`
      queryString += `&order[relevance]=desc`
    } else {
      const sortId = request.sort?.id ?? "chapter_updated_at"
      const sortDir = request.sort?.ascending ? "asc" : "desc"
      queryString += `&order[${sortId}]=${sortDir}`
    }

    queryString += `&limit=50&page=${request.page}`

    const url = `${this.apiUrl}/manga?${queryString.replace(/^&/, "")}`
    const response = await this.client.get(url)
    const data: SearchResponse = JSON.parse(response.data)

    console.log(url)
    return {
      results: data.result.items.map(mangaToHighlight),
      isLastPage:
        data.result.pagination.current_page >= data.result.pagination.last_page,
    }
  }

  async getContent(contentId: string): Promise<Content> {
    const url = `${this.apiUrl}/manga/${contentId}?includes[]=genre&includes[]=author&includes[]=artist&includes[]=theme&includes[]=demographic`
    const response = await this.client.get(url)
    const data: SingleMangaResponse = JSON.parse(response.data)
    const manga = data.result

    const status = convertStatus(manga.status)
    const chapters = await this.getChapters(contentId)

    const properties: Property[] = []

    const genreTerms = [
      ...(manga.genre ?? []),
      ...(manga.theme ?? []),
      ...(manga.demographic ?? []),
    ]
    if (genreTerms.length > 0)
      properties.push({
        id: "genres",
        title: "Genres",
        tags: genreTerms.map((t) => ({
          id: t.slug,
          title: t.title,
          adultContent: false,
        })),
      })

    const creatorTerms = [...(manga.author ?? []), ...(manga.artist ?? [])]
    if (creatorTerms.length > 0)
      properties.push({
        id: "creators",
        title: "Credits",
        tags: creatorTerms.map((t) => ({
          id: t.slug,
          title: t.title,
          noninteractive: true,
          adultContent: false,
        })),
      })

    return {
      title: manga.title,
      cover: manga.poster.large,
      summary: manga.synopsis ?? undefined,
      isNSFW: manga.is_nsfw,
      status,
      chapters,
      properties,
      webUrl: `${this.baseUrl}/title/${contentId}`,
      recommendedPanelMode: ReadingMode.WEBTOON,
    }
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    const chapters: Chapter[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const url = `${this.apiUrl}/manga/${contentId}/chapters?order[number]=desc&limit=100&page=${page}`
      const response = await this.client.get(url)
      const data: ChapterListResponse = JSON.parse(response.data)
      const { items, pagination } = data.result

      items.forEach((ch, i) => {
        chapters.push(chapterToChapter(ch, chapters.length + i))
      })

      hasMore = pagination.current_page < pagination.last_page
      page++
    }

    return chapters
  }

  async getChapterData(
    _contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const url = `${this.apiUrl}/chapters/${chapterId}`
    const response = await this.client.get(url)
    const data: ChapterImagesResponse = JSON.parse(response.data)
    return {
      pages: data.result.images.map((img) => ({ url: img.url })),
    }
  }

  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {
      filters: [
        {
          id: "genres",
          title: "Genres",
          type: FilterType.EXCLUDABLE_MULTISELECT,
          options: GENRES,
        },
        {
          id: "status",
          title: "Status",
          type: FilterType.MULTISELECT,
          options: STATUSES,
        },
        {
          id: "type",
          title: "Type",
          type: FilterType.MULTISELECT,
          options: TYPES,
        },
        {
          id: "demographic",
          title: "Demographic",
          type: FilterType.MULTISELECT,
          options: DEMOGRAPHICS,
        },
      ],
      sort: {
        options: SORTS,
        canChangeOrder: true,
        default: { id: "chapter_updated_at" },
      },
    }
  }
}

function mangaToHighlight(manga: ComixManga) {
  return {
    id: manga.hash_id,
    title: manga.title,
    cover: manga.poster.large,
  }
}

function convertStatus(status: string): PublicationStatus {
  switch (status) {
    case "releasing":
      return PublicationStatus.ONGOING
    case "finished":
      return PublicationStatus.COMPLETED
    case "on_hiatus":
      return PublicationStatus.HIATUS
    case "discontinued":
      return PublicationStatus.CANCELLED
    default:
      return PublicationStatus.ONGOING
  }
}

function chapterToChapter(ch: ComixChapter, index: number): Chapter {
  const title = ch.name
    ? `Chapter ${ch.number}: ${ch.name}`
    : `Chapter ${ch.number}`

  let providers: { id: string; name: string; links: [] }[] | undefined
  if (ch.scanlation_group) {
    providers = [
      {
        id: ch.scanlation_group.name,
        name: ch.scanlation_group.name,
        links: [],
      },
    ]
  } else if (ch.is_official === 1) {
    providers = [{ id: "official", name: "Official", links: [] }]
  }

  return {
    chapterId: ch.chapter_id.toString(),
    number: ch.number,
    title,
    index,
    date: new Date(ch.updated_at * 1000),
    language: "EN_US",
    ...(providers && { providers }),
  }
}
