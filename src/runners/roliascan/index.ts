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
  type ResolvedPageSection,
  type RunnerInfo,
  ReadingMode,
  SectionStyle,
} from "@suwatte/daisuke"
import {
  parseChapterPage,
  parseContent,
  parseFilterOptions,
  parseHighlights,
  parsePages,
} from "./parser"

export class Target implements ContentSource, ImageRequestHandler {
  baseUrl = "https://roliascan.com"

  info: RunnerInfo = {
    id: "kusa.roliascan",
    name: "Rolia Scan",
    thumbnail: "roliascan.png",
    version: 1.0,
    website: "https://roliascan.com",
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.SAFE,
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
      const url = `${this.baseUrl}/wp-content/themes/animacewp/most_viewed_series.json`
      const response = await this.client.get(url)
      const data: { most_viewed_series: { title: string; url: string; image: string }[] } =
        JSON.parse(response.data)

      const items = data.most_viewed_series
        .filter((m) => m.title)
        .map((m) => ({
          id: m.url.replace(this.baseUrl, "").replace(/^\/|\/$/g, ""),
          title: m.title,
          cover: m.image ?? "",
        }))

      return { items }
    }

    if (sectionID === "latest") {
      const url = `${this.baseUrl}/manga?_sort_posts=update_oldest`
      const response = await this.client.get(url)
      return { items: parseHighlights(response.data, this.baseUrl) }
    }

    throw new Error(`Unknown section: ${sectionID}`)
  }

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    let queryString = ""

    if (request.query) {
      queryString += `_post_type_search_box=${encodeURIComponent(request.query)}`
    }

    const filters = request.filters ?? {}
    for (const [key, value] of Object.entries(filters)) {
      if (value && typeof value === "string") {
        queryString += (queryString ? "&" : "") + `${key}=${encodeURIComponent(value)}`
      }
    }

    const url = queryString
      ? `${this.baseUrl}/manga?${queryString}`
      : `${this.baseUrl}/manga`

    const response = await this.client.get(url)
    const results = parseHighlights(response.data, this.baseUrl)

    return { results, isLastPage: true }
  }

  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.get(`${this.baseUrl}/${contentId}`)
    const partial = parseContent(response.data, this.baseUrl)
    const chapters = await this.getChapters(contentId)

    return {
      ...partial,
      chapters,
      webUrl: `${this.baseUrl}/${contentId}`,
      recommendedPanelMode: ReadingMode.WEBTOON,
    }
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    const chapters: Chapter[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const url = `${this.baseUrl}/${contentId}/chapterlist/?chap_page=${page}`
      const response = await this.client.get(url)
      const result = parseChapterPage(response.data, this.baseUrl, chapters.length)
      chapters.push(...result.chapters)
      hasMore = result.hasMore
      page++
    }

    return chapters
  }

  async getChapterData(
    _contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const response = await this.client.get(`${this.baseUrl}${chapterId}`)
    return { pages: parsePages(response.data) }
  }

  async getDirectoryConfig(): Promise<DirectoryConfig> {
    try {
      const response = await this.client.get(`${this.baseUrl}/manga`)
      const filterGroups = parseFilterOptions(response.data)

      return {
        filters: filterGroups.map((g) => ({
          id: g.id,
          title: g.title,
          type: FilterType.SELECT,
          options: g.options,
        })),
        sort: { options: [], canChangeOrder: false },
      }
    } catch {
      return { filters: [], sort: { options: [], canChangeOrder: false } }
    }
  }
}
