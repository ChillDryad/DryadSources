import {
  ContentRating,
  ContentStatus,
  type Chapter,
  type ChapterPage,
  type Content,
  type Delegate,
  type Item,
  type ItemListRequest,
  type NetworkRequest,
  type PagedItemList,
  type SearchRequest,
  type SourceConfiguration,
} from "@suwatte/toolchain/types"

type LegacyRunner = {
  getDirectory?: (request: Record<string, unknown>) => Promise<unknown>
  getContent?: (contentId: string) => Promise<unknown>
  getChapters?: (contentId: string) => Promise<unknown>
  getChapterData?: (contentId: string, chapterId: string) => Promise<unknown>
  willRequestImage?: (url: string) => Promise<unknown>
  config?: unknown
}

/**
 * Compatibility boundary for v6 parsers while each site is rewritten around
 * v7 types. It is deliberately limited to the stable reader operations.
 */
export class LegacyDelegateAdapter implements Delegate {
  constructor(protected readonly legacy: LegacyRunner, protected readonly rating: ContentRating) {}

  getConfiguration(): SourceConfiguration {
    const config = asRecord(this.legacy.config)
    return compact({
      imageReferer: stringValue(config.imageReferer),
      cloudflareResolutionURL: stringValue(config.cloudflareResolutionURL),
      useClientForImageRequests: booleanValue(config.useClientForImageRequests),
    })
  }

  async getSearchResults(request: SearchRequest, page: number): Promise<PagedItemList> {
    return this.directory({
      page,
      query: request.query,
      filters: request.filters ?? {},
      sort: request.sort ? { id: request.sort.key, ascending: request.sort.ascending } : undefined,
    })
  }

  async getItemList(request: ItemListRequest, page: number): Promise<PagedItemList> {
    return this.directory({
      page,
      filters: {},
      sort: request.sort ? { id: request.sort.key, ascending: request.sort.ascending } : undefined,
    })
  }

  async getContent(contentId: string): Promise<Content> {
    const legacyContent = await this.requireMethod("getContent")(contentId)
    const value = asRecord(legacyContent)
    const chapters = Array.isArray(value.chapters)
      ? value.chapters.map((chapter, index) => toChapter(chapter, index))
      : undefined

    return {
      title: stringValue(value.title) ?? contentId,
      coverImage: stringValue(value.cover) ?? stringValue(value.coverImage) ?? "https://via.placeholder.com/1",
      summary: stringValue(value.summary),
      webUrl: stringValue(value.webUrl),
      rating: this.rating,
      status: toStatus(value.status),
      genres: tags(value.properties),
      chapters,
    }
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    if (this.legacy.getChapters) {
      const chapters = await this.legacy.getChapters(contentId)
      if (Array.isArray(chapters)) return chapters.map((chapter, index) => toChapter(chapter, index))
    }

    const content = asRecord(await this.requireMethod("getContent")(contentId))
    return Array.isArray(content.chapters)
      ? content.chapters.map((chapter, index) => toChapter(chapter, index))
      : []
  }

  async getChapterPages(contentId: string, chapterId: string): Promise<ChapterPage[]> {
    const data = asRecord(await this.requireMethod("getChapterData")(contentId, chapterId))
    return Array.isArray(data.pages)
      ? data.pages.map((page) => {
          const value = asRecord(page)
          return { url: stringValue(value.url) }
        })
      : []
  }

  async willRequestImage(request: NetworkRequest): Promise<NetworkRequest> {
    if (!this.legacy.willRequestImage) return request
    const transformed = asRecord(await this.legacy.willRequestImage(request.url))
    return {
      ...request,
      ...transformed,
      headers: { ...request.headers, ...asRecord(transformed.headers) as Record<string, string> },
    }
  }

  private async directory(request: Record<string, unknown>): Promise<PagedItemList> {
    const legacyDirectory = this.requireMethod("getDirectory")
    const response = asRecord(await legacyDirectory(request))
    const results = Array.isArray(response.results) ? response.results : []
    return {
      items: results.map((result) => toItem(result, this.rating)),
      isLastPage: booleanValue(response.isLastPage) ?? results.length === 0,
      total: numberValue(response.total),
    }
  }

  private requireMethod<T extends keyof LegacyRunner>(name: T): NonNullable<LegacyRunner[T]> {
    const method = this.legacy[name]
    if (!method) throw new Error(`The legacy source does not implement ${name}`)
    return method.bind(this.legacy) as NonNullable<LegacyRunner[T]>
  }
}

function toItem(raw: unknown, rating: ContentRating): Item {
  const value = asRecord(raw)
  return {
    id: stringValue(value.id) ?? stringValue(value.contentId) ?? "unknown",
    title: stringValue(value.title) ?? "Untitled",
    subtitle: stringValue(value.subtitle),
    coverImage: stringValue(value.cover) ?? stringValue(value.coverImage),
    webUrl: stringValue(value.webUrl),
    rating,
  }
}

function toChapter(raw: unknown, index: number): Chapter {
  const value = asRecord(raw)
  const id = stringValue(value.chapterId) ?? stringValue(value.id) ?? String(index)
  const number = numberValue(value.number) ?? -1
  return {
    id,
    index: numberValue(value.index) ?? index,
    number: number >= 0 ? number : -1,
    title: stringValue(value.title),
    language: normalizeLanguage(stringValue(value.language)),
    date: dateValue(value.date),
    webUrl: stringValue(value.webUrl),
  }
}

function tags(raw: unknown): Array<{ id: string; title: string }> | undefined {
  if (!Array.isArray(raw)) return undefined
  const entries: Array<{ id: string; title: string }> = []
  for (const section of raw) {
    const value = asRecord(section)
    if (!Array.isArray(value.tags)) continue
    for (const tag of value.tags) {
      const tagValue = asRecord(tag)
      const title = stringValue(tagValue.title)
      if (title) entries.push({ id: stringValue(tagValue.id) ?? title, title })
    }
  }
  return entries.length ? entries : undefined
}

function toStatus(value: unknown): ContentStatus | undefined {
  const number = numberValue(value)
  if (number === undefined) return undefined
  return number >= ContentStatus.UNKNOWN && number <= ContentStatus.HIATUS
    ? number as ContentStatus
    : ContentStatus.UNKNOWN
}

function normalizeLanguage(value: string | undefined): string | undefined {
  return value?.replace("_", "-").toLowerCase()
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {}
}
function stringValue(value: unknown): string | undefined { return typeof value === "string" ? value : undefined }
function booleanValue(value: unknown): boolean | undefined { return typeof value === "boolean" ? value : undefined }
function numberValue(value: unknown): number | undefined { return typeof value === "number" && Number.isFinite(value) ? value : undefined }
function dateValue(value: unknown): Date | undefined {
  if (value instanceof Date) return value
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value)
    return Number.isNaN(date.valueOf()) ? undefined : date
  }
  return undefined
}
function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, candidate]) => candidate !== undefined)) as T
}
