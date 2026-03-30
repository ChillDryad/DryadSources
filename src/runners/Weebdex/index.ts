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
import {
  CONTENT_RATINGS,
  DEMOGRAPHICS,
  ORIG_LANGUAGES,
  SORTS,
  STATUSES,
  TAG_OPTIONS,
} from "./constants"
import {
  type WeebdexChapter,
  type WeebdexChapterList,
  type WeebdexManga,
  type WeebdexMangaList,
  type WeebdexUpdatesList,
} from "./types"

export class Target implements ContentSource, ImageRequestHandler {
  baseUrl = "https://weebdex.org"
  apiUrl = "https://api.weebdex.org"

  info: RunnerInfo = {
    id: "kusa.weebdex",
    name: "Weebdex",
    thumbnail: "weebdex.png",
    version: 1.0,
    website: "https://weebdex.org",
    supportedLanguages: [],
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
      { id: "popular", title: "Most Popular", style: SectionStyle.GALLERY },
      { id: "latest", title: "Latest Updates", style: SectionStyle.GALLERY },
    ]
  }

  async resolvePageSection(
    link: PageLink,
    sectionID: string,
  ): Promise<ResolvedPageSection> {
    if (link.id !== "home") throw new Error(`Unknown page: ${link.id}`)

    if (sectionID === "popular") {
      const url = `${this.apiUrl}/manga?sort=views&order=desc&hasChapters=1&limit=20&page=1`
      const response = await this.client.get(url)
      const data: WeebdexMangaList = JSON.parse(response.data)
      return { items: data.data.map(mangaToHighlight) }
    }

    if (sectionID === "latest") {
      const url = `${this.apiUrl}/chapter?sort=publishedAt&order=desc&limit=20&page=1`
      const response = await this.client.get(url)
      const data: WeebdexUpdatesList = JSON.parse(response.data)
      const mangaMap = data.map?.manga ?? {}
      const seen = new Set<string>()
      const items = []
      for (const entry of data.data) {
        const id = entry.relationships?.manga?.id
        if (id && !seen.has(id) && mangaMap[id]) {
          seen.add(id)
          items.push(mangaToHighlight(mangaMap[id]))
        }
      }
      return { items }
    }

    throw new Error(`Unknown section: ${sectionID}`)
  }

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    let queryString = "hasChapters=1"

    if (request.query) {
      queryString += `&title=${encodeURIComponent(request.query)}`
    } else {
      const { tags } = request.filters ?? {}
      if (tags) {
        const { included, excluded } = tags as {
          included?: string[]
          excluded?: string[]
        }
        if (included?.length) {
          queryString += "&" + included.map((v) => `tag=${v}`).join("&")
          queryString += "&tmod=0"
        }
        if (excluded?.length) {
          queryString += "&" + excluded.map((v) => `tagx=${v}`).join("&")
          queryString += "&txmod=0"
        }
      }
    }

    const { status, demographic, contentRating, lang: origLang } =
      request.filters ?? {}

    if (status) queryString += `&status=${status}`
    if (demographic) queryString += `&demographic=${demographic}`
    if (contentRating) queryString += `&contentRating=${contentRating}`
    if (origLang) queryString += `&lang=${origLang}`

    const sortId = request.sort?.id ?? "lastUploadedChapterAt"
    const sortDir = request.sort?.ascending ? "asc" : "desc"
    queryString += `&sort=${sortId}&order=${sortDir}`
    queryString += `&page=${request.page}`

    const url = `${this.apiUrl}/manga?${queryString}`
    const response = await this.client.get(url)
    const data: WeebdexMangaList = JSON.parse(response.data)

    return {
      results: data.data.map(mangaToHighlight),
      isLastPage: data.page * data.limit >= data.total,
    }
  }

  async getContent(contentId: string): Promise<Content> {
    const url = `${this.apiUrl}/manga/${contentId}`
    const response = await this.client.get(url)
    const manga: WeebdexManga = JSON.parse(response.data)

    const rel = manga.relationships
    const cover = rel?.cover
    const coverUrl = cover
      ? `${this.baseUrl}/covers/${manga.id}/${cover.id}${cover.ext}`
      : undefined

    const chapters = await this.getChapters(contentId)
    const properties: Property[] = []

    if (rel?.tags.length) {
      properties.push({
        id: "genres",
        title: "Genres",
        tags: rel.tags.map((t) => ({
          id: t.name.toLowerCase().replace(/\s+/g, "-"),
          title: t.name,
          adultContent: false,
        })),
      })
    }

    const creators = [
      ...(rel?.authors ?? []),
      ...(rel?.artists ?? []),
    ]
    if (creators.length) {
      properties.push({
        id: "creators",
        title: "Credits",
        tags: creators.map((c) => ({
          id: c.name.toLowerCase().replace(/\s+/g, "-"),
          title: c.name,
          noninteractive: true,
          adultContent: false,
        })),
      })
    }

    return {
      title: manga.title,
      cover: coverUrl,
      summary: manga.description || undefined,
      status: convertStatus(manga.status),
      chapters,
      properties,
      webUrl: `${this.baseUrl}/title/${contentId}`,
      recommendedPanelMode: ReadingMode.PAGED_MANGA,
    }
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    const chapters: Chapter[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const url = `${this.apiUrl}/manga/${contentId}/chapters?order=desc&page=${page}`
      const response = await this.client.get(url)
      const data: WeebdexChapterList = JSON.parse(response.data)

      data.data.forEach((ch, i) => {
        chapters.push(chapterToChapter(ch, chapters.length + i))
      })

      hasMore = data.page * data.limit < data.total
      page++
    }

    return chapters
  }

  async getChapterData(
    _contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const url = `${this.apiUrl}/chapter/${chapterId}`
    const response = await this.client.get(url)
    const chapter: WeebdexChapter = JSON.parse(response.data)
    const pages = (chapter.data ?? chapter.data_optimized ?? [])
      .filter((p) => p.name)
      .map((p) => ({ url: `${chapter.node}/data/${chapter.id}/${p.name}` }))
    return { pages }
  }

  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {
      filters: [
        {
          id: "tags",
          title: "Tags",
          type: FilterType.EXCLUDABLE_MULTISELECT,
          options: TAG_OPTIONS,
        },
        {
          id: "status",
          title: "Status",
          type: FilterType.SELECT,
          options: STATUSES,
        },
        {
          id: "demographic",
          title: "Demographic",
          type: FilterType.SELECT,
          options: DEMOGRAPHICS,
        },
        {
          id: "contentRating",
          title: "Content Rating",
          type: FilterType.SELECT,
          options: CONTENT_RATINGS,
        },
        {
          id: "lang",
          title: "Original Language",
          type: FilterType.SELECT,
          options: ORIG_LANGUAGES,
        },
      ],
      sort: {
        options: SORTS,
        canChangeOrder: true,
        default: { id: "lastUploadedChapterAt" },
      },
    }
  }
}

function mangaToHighlight(manga: WeebdexManga) {
  const cover = manga.relationships?.cover
  const coverUrl = cover
    ? `https://weebdex.org/covers/${manga.id}/${cover.id}${cover.ext}`
    : undefined
  return {
    id: manga.id,
    title: manga.title,
    cover: coverUrl,
  }
}

function convertStatus(status: string | null): PublicationStatus {
  switch (status) {
    case "ongoing":
      return PublicationStatus.ONGOING
    case "completed":
      return PublicationStatus.COMPLETED
    case "hiatus":
      return PublicationStatus.HIATUS
    case "cancelled":
      return PublicationStatus.CANCELLED
    default:
      return PublicationStatus.ONGOING
  }
}

function buildChapterTitle(ch: WeebdexChapter): string {
  const parts: string[] = []
  if (ch.volume?.trim()) parts.push(`Vol.${ch.volume.trim()}`)
  if (ch.chapter?.trim()) parts.push(`Ch.${ch.chapter.trim()}`)
  if (ch.title?.trim()) {
    if (parts.length) parts.push("-")
    parts.push(ch.title.trim())
  }
  return parts.length ? parts.join(" ") : "Oneshot"
}

function parseChapterNumber(chapter: string | null): number {
  if (!chapter?.trim()) return -1
  const match = chapter.match(/\d+(\.\d+)?/)
  return match ? parseFloat(match[0]) : -1
}

function chapterToChapter(ch: WeebdexChapter, index: number): Chapter {
  const groups = ch.relationships?.groups ?? []
  const providers =
    groups.length > 0
      ? groups.map((g) => ({ id: g.name, name: g.name, links: [] as [] }))
      : [{ id: "No Group", name: "No Group", links: [] as [] }]

  const volume = ch.volume ? parseFloat(ch.volume) : undefined

  return {
    chapterId: ch.id,
    number: parseChapterNumber(ch.chapter),
    title: buildChapterTitle(ch),
    index,
    date: new Date(ch.published_at),
    language: ch.language,
    providers,
    ...(volume && !isNaN(volume) ? { volume } : {}),
  }
}
