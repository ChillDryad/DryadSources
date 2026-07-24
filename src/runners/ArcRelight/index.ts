import {
  CatalogRating,
  type Chapter,
  type ChapterData,
  type Content,
  type ContentSource,
  type DirectoryConfig,
  type DirectoryRequest,
  FilterType,
  type PagedResult,
  type RunnerInfo,
  ReadingMode,
  type Tag,
} from "@suwatte/daisuke"

const ARC_RELIGHT_CATEGORIES = [
  "4-Koma",
  "Chaos;Head",
  "Collection",
  "Comedy",
  "Drama",
  "Jubilee",
  "Mystery",
  "Psychological",
  "Robotics;Notes",
  "Romance",
  "Sci-Fi",
  "Seinen",
  "Shounen",
  "Steins;Gate",
  "Supernatural",
  "Tragedy",
]

interface SeriesResponse {
  slug: string
  title: string
  cover: string
  description?: string
  status?: string
  licensed?: boolean
  aliases?: string[]
  authors?: string[]
  artists?: string[]
  categories?: string[]
}

interface ChapterResponse {
  id: number
  title: string
  number: number
  volume: number | null
  published: string
  final: boolean
  series: string
  groups: string[]
  full_title: string
}

interface PageResponse {
  id: number
  image: string
  number: number
  url: string
}

export class Target implements ContentSource {
  baseUrl = "https://arc-relight.com"
  apiUrl = "https://arc-relight.com/api/v2"

  info: RunnerInfo = {
    id: "kusa.arcrelight",
    name: "ArcRelight",
    thumbnail: "arcrelight.png",
    version: 1.0,
    website: this.baseUrl,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.MIXED,
  }
  client = new NetworkClient()

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const page = request.page || 1
    const params: Record<string, string | undefined> = {
      page: page.toString(),
    }

    // Default sort by views (popular)
    let sort = "-views"
    if (request.sort?.id) {
      sort = request.sort.ascending ? request.sort.id : `-${request.sort.id}`
    }
    params.sort = sort

    if (request.query) params.title = request.query
    if (request.filters?.author) params.author = request.filters.author
    if (request.filters?.artist) params.artist = request.filters.artist
    if (request.filters?.status) params.status = request.filters.status
    if (request.filters?.categories) {
      const cats = request.filters.categories as string[]
      params.categories = cats.join(",")
    }

    const response = await this.client.get(`${this.apiUrl}/series`, { params })
    const json = JSON.parse(response.data) as { last: boolean; results: SeriesResponse[] }

    const highlights = json.results.map((series) => ({
      id: series.slug,
      title: series.title,
      cover: series.cover,
    }))

    return {
      results: highlights,
      isLastPage: json.last,
    }
  }

  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.get(`${this.apiUrl}/series/${contentId}`)
    const series = JSON.parse(response.data) as SeriesResponse

    let description = series.description || ""
    if (series.aliases?.length) {
      description += `\n\nAlternative titles:\n${series.aliases.join("\n")}`
    }

    let status = 0
    if (series.licensed) status = 4 // LICENSED
    else if (series.status === "completed") status = 1
    else if (series.status === "ongoing") status = 0
    else if (series.status === "hiatus") status = 2
    else if (series.status === "canceled") status = 3

    const chapters = await this.getChapters(contentId)

    return {
      title: series.title,
      cover: series.cover,
      summary: description,
      creators: [
        ...(series.authors || []),
        ...(series.artists || []),
      ].filter(Boolean),
      status,
      isNSFW: false,
      chapters,
      recommendedPanelMode: ReadingMode.PAGED_COMIC,
      webUrl: `${this.baseUrl}/reader/${contentId}`,
    }
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    const response = await this.client.get(
      `${this.apiUrl}/series/${contentId}/chapters`,
      { params: { date_format: "timestamp" } },
    )
    const json = JSON.parse(response.data) as { results: ChapterResponse[] }

    const chapters: Chapter[] = json.results.map((ch, i) => {
      const name = ch.final ? `${ch.full_title} [END]` : ch.full_title
      return {
        chapterId: ch.id.toString(),
        title: name,
        number: ch.number,
        index: i,
        language: "EN_US",
        date: new Date(parseInt(ch.published) * 1000),
      }
    })

    return chapters
  }

  async getChapterData(
    _contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const response = await this.client.get(`${this.apiUrl}/chapters/${chapterId}/pages`, {
      params: { track: "true" },
    })
    const json = JSON.parse(response.data) as { results: PageResponse[] }

    const pages = json.results
      .sort((a, b) => a.number - b.number)
      .map((page) => ({ url: page.image }))

    return { pages }
  }

  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {
      filters: [
        {
          id: "author",
          title: "Author",
          type: FilterType.TEXT,
        },
        {
          id: "artist",
          title: "Artist",
          type: FilterType.TEXT,
        },
        {
          id: "status",
          title: "Status",
          type: FilterType.SELECT,
          options: [
            { id: "Any", title: "Any" },
            { id: "Completed", title: "Completed" },
            { id: "Ongoing", title: "Ongoing" },
            { id: "Hiatus", title: "Hiatus" },
            { id: "Cancelled", title: "Cancelled" },
          ],
        },
        {
          id: "categories",
          title: "Categories",
          type: FilterType.MULTISELECT,
          options: ARC_RELIGHT_CATEGORIES.map((cat) => ({
            id: cat,
            title: cat,
          })) as Tag[],
        },
      ],
      sort: {
        options: [
          { id: "title", title: "Title" },
          { id: "views", title: "Views" },
          { id: "latest_upload", title: "Latest Upload" },
          { id: "chapter_count", title: "Chapter Count" },
        ],
        canChangeOrder: true,
        default: { id: "views" },
      },
    }
  }
}