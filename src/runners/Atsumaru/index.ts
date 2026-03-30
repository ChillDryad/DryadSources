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
import { ALL_TYPES, GENRES, SORTS, STATUSES, TYPES } from "./constants"
import {
  type AtsumaraBrowseResponse,
  type AtsumaruChapter,
  type AtsumaruChapterListResponse,
  type AtsumaruManga,
  type AtsumaruMangaResponse,
  type AtsumaruPageResponse,
  type AtsumaruSearchRequest,
  type AtsumaruSearchResponse,
} from "./types"

export class Target implements ContentSource, ImageRequestHandler {
  baseUrl = "https://atsu.moe"

  info: RunnerInfo = {
    id: "kusa.atsumaru",
    name: "Atsumaru",
    thumbnail: "atsumaru.png",
    version: 1.0,
    website: "https://atsu.moe",
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.MIXED,
    minSupportedAppVersion: "5.0",
  }

  client = new NetworkClient()

  async willRequestImage(url: string): Promise<NetworkRequest> {
    return {
      url,
      headers: { referer: `${this.baseUrl}/` },
    }
  }

  async getSectionsForPage(page: PageLink): Promise<PageSection[]> {
    if (page.id !== "home") throw new Error("Page not found")
    return [
      { id: "popular", title: "Trending", style: SectionStyle.GALLERY },
      { id: "latest", title: "Recently Updated", style: SectionStyle.GALLERY },
    ]
  }

  async resolvePageSection(
    link: PageLink,
    sectionID: string,
  ): Promise<ResolvedPageSection> {
    if (link.id !== "home") throw new Error(`Unknown page: ${link.id}`)

    const endpointMap: Record<string, string> = {
      popular: "trending",
      latest: "recentlyUpdated",
    }
    const endpoint = endpointMap[sectionID]
    if (!endpoint) throw new Error(`Unknown section: ${sectionID}`)

    const url = `${this.baseUrl}/api/infinite/${endpoint}?page=0&types=Manga,Manwha,Manhua,OEL`
    const response = await this.client.get(url)
    const data: AtsumaraBrowseResponse = JSON.parse(response.data)
    return { items: data.items.map(mangaToHighlight) }
  }

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const filters = request.filters ?? {}
    const types = (filters.types as string[] | undefined) ?? ALL_TYPES
    const status = filters.status as string[] | undefined
    const genres = filters.genres as string[] | undefined
    const showAdult = (filters.adult as boolean | undefined) ?? false
    const officialTranslation =
      (filters.official as boolean | undefined) ?? false

    const filter: AtsumaruSearchRequest["filter"] = {
      types,
      showAdult,
      officialTranslation,
      sortBy: request.sort?.id ?? "trending",
      ...(request.query ? { search: request.query } : {}),
      ...(status?.length ? { status } : {}),
      ...(genres?.length ? { genres } : {}),
    }

    const body: AtsumaruSearchRequest = { page: request.page - 1, filter }

    const response = await this.client.post(
      `${this.baseUrl}/api/explore/filteredView`,
      { body, headers: { "Content-Type": "application/json" } },
    )
    const raw = JSON.parse(response.data)

    // API returns either a search result shape { hits, found, requestParams }
    // or a browse shape { items } depending on the query
    if (raw.items) {
      const data = raw as AtsumaraBrowseResponse
      return {
        results: data.items.map(mangaToHighlight),
        isLastPage: data.items.length === 0,
      }
    }

    const data = raw as AtsumaruSearchResponse
    return {
      results: data.hits.map((h) => mangaToHighlight(h.document)),
      isLastPage:
        (data.page + 1) * data.requestParams.perPage >= data.found,
    }
  }

  async getContent(contentId: string): Promise<Content> {
    const url = `${this.baseUrl}/api/manga/page?id=${contentId}`
    const response = await this.client.get(url)
    const data: AtsumaruMangaResponse = JSON.parse(response.data)
    const manga = data.mangaPage

    const scanlatorMap: Record<string, string> = {}
    for (const s of manga.scanlators ?? []) {
      scanlatorMap[s.id] = s.name
    }

    const chapters = await this.fetchChapters(contentId, scanlatorMap)
    const properties: Property[] = []

    if (manga.tags?.length) {
      properties.push({
        id: "genres",
        title: "Genres",
        tags: manga.tags.map((t) => ({
          id: t.name.toLowerCase().replace(/\s+/g, "-"),
          title: t.name,
          adultContent: false,
        })),
      })
    }

    if (manga.authors?.length) {
      properties.push({
        id: "creators",
        title: "Credits",
        tags: manga.authors.map((a) => ({
          id: a.name.toLowerCase().replace(/\s+/g, "-"),
          title: a.name,
          noninteractive: true,
          adultContent: false,
        })),
      })
    }

    return {
      title: manga.title,
      cover: normalizeImageUrl(manga.poster ?? manga.image ?? null, this.baseUrl),
      summary: manga.synopsis ?? undefined,
      status: convertStatus(manga.status),
      chapters,
      properties,
      webUrl: `${this.baseUrl}/read/${contentId}`,
      recommendedPanelMode: ReadingMode.PAGED_MANGA,
    }
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    const detailsResponse = await this.client.get(
      `${this.baseUrl}/api/manga/page?id=${contentId}`,
    )
    const manga: AtsumaruMangaResponse = JSON.parse(detailsResponse.data)
    const scanlatorMap: Record<string, string> = {}
    for (const s of manga.mangaPage.scanlators ?? []) {
      scanlatorMap[s.id] = s.name
    }
    return this.fetchChapters(contentId, scanlatorMap)
  }

  private async fetchChapters(
    contentId: string,
    scanlatorMap: Record<string, string>,
  ): Promise<Chapter[]> {
    const url = `${this.baseUrl}/api/manga/allChapters?mangaId=${contentId}`
    const response = await this.client.get(url)
    const data: AtsumaruChapterListResponse = JSON.parse(response.data)

    return data.chapters.map((ch, index) =>
      chapterToChapter(ch, index, scanlatorMap),
    )
  }

  async getChapterData(
    contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const url = `${this.baseUrl}/api/read/chapter?mangaId=${contentId}&chapterId=${chapterId}`
    const response = await this.client.get(url)
    const data: AtsumaruPageResponse = JSON.parse(response.data)
    return {
      pages: data.readChapter.pages.map((p) => ({
        url: normalizeImageUrl(p.image, this.baseUrl),
      })),
    }
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
          type: FilterType.MULTISELECT,
          options: STATUSES,
        },
        {
          id: "types",
          title: "Type",
          type: FilterType.MULTISELECT,
          options: TYPES,
        },
        {
          id: "adult",
          title: "Show Adult Content",
          type: FilterType.TOGGLE,
        },
        {
          id: "official",
          title: "Official Translations Only",
          type: FilterType.TOGGLE,
        },
      ],
      sort: {
        options: SORTS,
        canChangeOrder: false,
        default: { id: "trending" },
      },
    }
  }
}

function mangaToHighlight(manga: AtsumaruManga) {
  return {
    id: manga.id,
    title: manga.title,
    cover: normalizeImageUrl(manga.poster ?? manga.image ?? null, "https://atsu.moe"),
  }
}

function extractImagePath(value: unknown): string | null {
  if (!value) return null
  if (typeof value === "string") return value
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    const candidate = obj.lg ?? obj.md ?? obj.sm ?? obj.url ?? Object.values(obj)[0]
    if (typeof candidate === "string") return candidate
  }
  return null
}

function normalizeImageUrl(
  value: unknown,
  baseUrl: string,
): string | undefined {
  const path = extractImagePath(value)
  if (!path) return undefined
  let url: string
  if (path.startsWith("http")) {
    url = path
  } else if (path.startsWith("//")) {
    url = "https:" + path
  } else {
    url = `${baseUrl}/static/${path.replace(/^\/?(static\/)?/, "")}`
  }
  return url.replace(/^http:\/\//, "https://")
}

function convertStatus(status: string | null | undefined): PublicationStatus {
  switch (status?.toLowerCase()) {
    case "ongoing":
      return PublicationStatus.ONGOING
    case "completed":
      return PublicationStatus.COMPLETED
    case "hiatus":
      return PublicationStatus.HIATUS
    case "canceled":
    case "cancelled":
      return PublicationStatus.CANCELLED
    default:
      return PublicationStatus.ONGOING
  }
}

function parseChapterDate(createdAt: string | number | null | undefined): Date {
  if (createdAt == null) return new Date(0)
  if (typeof createdAt === "number") return new Date(createdAt * 1000)
  return new Date(createdAt)
}

function chapterToChapter(
  ch: AtsumaruChapter,
  index: number,
  scanlatorMap: Record<string, string>,
): Chapter {
  const scanlatorName =
    ch.scanlationMangaId ? scanlatorMap[ch.scanlationMangaId] : undefined

  return {
    chapterId: ch.id,
    number: ch.number,
    title: ch.title?.trim() || `Chapter ${ch.number}`,
    index,
    date: parseChapterDate(ch.createdAt),
    language: "EN_US",
    ...(scanlatorName
      ? { providers: [{ id: scanlatorName, name: scanlatorName, links: [] as [] }] }
      : {}),
  }
}
