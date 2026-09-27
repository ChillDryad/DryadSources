import {
  ContentRating,
  ContentStatus,
  ContentType,
  type Chapter,
  type ChapterPage,
  type Content,
  type Delegate,
  type Item,
  type ItemListRequest,
  type PagedItemList,
  type SearchRequest,
  type SourceConfiguration,
  type SourceInfo,
} from "@suwatte/toolchain/types"

type AtsumaruManga = {
  id: string
  title: string
  poster?: unknown
  image?: unknown
  authors?: { name: string }[] | null
  synopsis?: string | null
  tags?: { name: string }[] | null
  status?: string | null
  type?: string | null
  scanlators?: { id: string; name: string }[] | null
}

type BrowseResponse = { items: AtsumaruManga[] }
type MangaResponse = { mangaPage: AtsumaruManga }
type ChapterResponse = {
  chapters: Array<{
    id: string
    number: number | string
    title?: string | null
    scanlationMangaId?: string | null
    createdAt?: string | number | null
  }>
}
type PageResponse = { readChapter: { pages: Array<{ image: string }> } }

export default class Atsumaru implements Delegate {
  static info: SourceInfo = {
    id: "en.atsumaru",
    name: "Atsumaru",
    version: 1,
    website: "https://atsu.moe",
    thumbnail: "atsumaru.png",
    languages: ["en"],
    rating: ContentRating.MATURE,
    minSupportedAppVersion: "7.0.0",
  }

  client = new HttpClient({
    baseUrl: "https://atsu.moe",
    headers: { Accept: "application/json" },
    // Omit a local limiter: the current emulator uses an unref'd scheduling
    // timer for rate-limited requests, which can terminate a Node test before
    // a queued request starts. The site has no observed throttling response.
  })

  getConfiguration(): SourceConfiguration {
    return {
      imageReferer: "https://atsu.moe/",
      useClientForImageRequests: true,
    }
  }

  async getSearchResults(
    request: SearchRequest,
    page: number,
  ): Promise<PagedItemList> {
    // The former filteredView endpoint was removed by Atsumaru. Until the
    // site publishes a replacement, retain a reliable discoverability path.
    return this.getBrowsePage(request.sort?.key === "latest" ? "latest" : "trending", page)
  }

  async getItemList(
    request: ItemListRequest,
    page: number,
  ): Promise<PagedItemList> {
    const key = request.key === "latest" ? "latest" : "trending"
    return this.getBrowsePage(key, page)
  }

  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.get("/api/manga/page", {
      params: { id: contentId },
    })
    ensureOk(response, "Atsumaru content")
    const data = await response.json<MangaResponse>()
    const manga = data.mangaPage
    const chapters = await this.getChapters(contentId)

    return {
      title: manga.title,
      coverImage: imageUrl(manga.poster ?? manga.image),
      summary: manga.synopsis ?? undefined,
      status: contentStatus(manga.status),
      contentType: contentType(manga.type),
      rating: ContentRating.MATURE,
      chapters,
      credits: manga.authors?.map((author) => ({ name: author.name })),
      genres: manga.tags?.map((tag) => ({
        id: slug(tag.name),
        title: tag.name,
      })),
      webUrl: `https://atsu.moe/read/${contentId}`,
    }
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    const [mangaResponse, chapterResponse] = await Promise.all([
      this.client.get("/api/manga/page", { params: { id: contentId } }),
      this.client.get("/api/manga/allChapters", { params: { mangaId: contentId } }),
    ])
    ensureOk(mangaResponse, "Atsumaru manga")
    ensureOk(chapterResponse, "Atsumaru chapters")

    const manga = (await mangaResponse.json<MangaResponse>()).mangaPage
    const scanlators = new Map(
      (manga.scanlators ?? []).map((scanlator) => [scanlator.id, scanlator.name]),
    )
    const data = await chapterResponse.json<ChapterResponse>()

    return data.chapters.map((chapter, index) => ({
      id: chapter.id,
      index,
      number: chapterNumber(chapter.number),
      title: chapter.title?.trim() || `Chapter ${chapter.number}`,
      language: "en",
      date: chapterDate(chapter.createdAt),
      ...(chapter.scanlationMangaId && scanlators.has(chapter.scanlationMangaId)
        ? {
            providers: [
              {
                id: chapter.scanlationMangaId,
                name: scanlators.get(chapter.scanlationMangaId)!,
                links: [],
              },
            ],
          }
        : {}),
    }))
  }

  async getChapterPages(
    contentId: string,
    chapterId: string,
  ): Promise<ChapterPage[]> {
    const response = await this.client.get("/api/read/chapter", {
      params: { mangaId: contentId, chapterId },
    })
    ensureOk(response, "Atsumaru chapter pages")
    const data = await response.json<PageResponse>()
    return data.readChapter.pages.map((page) => ({ url: imageUrl(page.image) }))
  }

  private async getBrowsePage(
    kind: "trending" | "latest",
    page: number,
  ): Promise<PagedItemList> {
    const endpoint = kind === "latest" ? "recentlyUpdated" : "trending"
    const response = await this.client.get(`/api/infinite/${endpoint}`, {
      params: {
        page: Math.max(page - 1, 0),
        types: "Manga,Manwha,Manhua,OEL",
      },
    })
    ensureOk(response, `Atsumaru ${kind}`)
    const data = await response.json<BrowseResponse>()
    return {
      items: data.items.map(toItem),
      isLastPage: data.items.length === 0,
    }
  }
}

function ensureOk(response: HttpResponse, label: string): void {
  if (!response.ok) throw new Error(`${label} request failed: HTTP ${response.status}`)
}

function toItem(manga: AtsumaruManga): Item {
  return {
    id: manga.id,
    title: manga.title,
    coverImage: imageUrl(manga.poster ?? manga.image),
    rating: ContentRating.MATURE,
    webUrl: `https://atsu.moe/read/${manga.id}`,
  }
}

function imageUrl(value: unknown): string {
  const path = imagePath(value)
  if (!path) return "https://atsu.moe/assets/placeholder.png"
  if (path.startsWith("https://")) return path
  if (path.startsWith("http://")) return path.replace(/^http:/, "https:")
  if (path.startsWith("//")) return `https:${path}`
  return `https://atsu.moe/static/${path.replace(/^\/?(static\/)?/, "")}`
}

function imagePath(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (!value || typeof value !== "object") return undefined
  const record = value as Record<string, unknown>
  return [record.lg, record.md, record.sm, record.url, ...Object.values(record)].find(
    (candidate): candidate is string => typeof candidate === "string",
  )
}

function chapterNumber(value: number | string): number {
  const number = typeof value === "number" ? value : Number.parseFloat(value)
  return Number.isFinite(number) && number >= 0 ? number : -1
}

function chapterDate(value: string | number | null | undefined): Date | undefined {
  if (value == null) return undefined
  return new Date(typeof value === "number" ? value * 1000 : value)
}

function contentStatus(status: string | null | undefined): ContentStatus {
  switch (status?.toLowerCase()) {
    case "ongoing": return ContentStatus.ONGOING
    case "completed": return ContentStatus.COMPLETED
    case "hiatus": return ContentStatus.HIATUS
    case "canceled":
    case "cancelled": return ContentStatus.CANCELLED
    default: return ContentStatus.UNKNOWN
  }
}

function contentType(type: string | null | undefined): ContentType {
  switch (type?.toLowerCase()) {
    case "manhua": return ContentType.MANHUA
    case "manwha":
    case "manhwa": return ContentType.MANHWA
    case "comic": return ContentType.COMIC
    default: return ContentType.MANGA
  }
}

function slug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}
