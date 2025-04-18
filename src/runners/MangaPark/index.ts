import type {
  Chapter,
  ChapterData,
  Content,
  ContentSource,
  DirectoryConfig,
  DirectoryRequest,
  PagedResult,
  Property,
  RunnerInfo,
} from "@suwatte/daisuke"

import { CatalogRating, FilterType } from "@suwatte/daisuke"
import {
  ADULT_GENRES,
  ALL_GENRES,
  CHAPTERS,
  CONTENT_TYPE,
  DEMOGRAPHICS,
  GENRES,
  LANGUAGE,
  SORT,
  STATUS,
} from "./constants"
import { ChaptersQuery, ContentQuery, PagesQuery, SearchQuery } from "./queries"

export class Target implements ContentSource {
  info: RunnerInfo = {
    id: "kusa.mangapark",
    name: "MangaPark",
    version: 0.4,
    website: "https://mangapark.io",
    thumbnail: "mangapark.png",
    supportedLanguages: ["EN_US"],
    minSupportedAppVersion: "5.0",
    rating: CatalogRating.MIXED,
  }
  private client = new NetworkClient()

  async getContent(contentId: string): Promise<Content> {
    const { data } = await this.client.post("https://mangapark.io/apo/", {
      headers: {
        "content-type": "application/json",
      },
      body: {
        query: ContentQuery,
        variables: {
          id: contentId,
        },
      },
    })
    const content = JSON.parse(data).data.get_comicNode.data
    const chapters = await this.getChapters(contentId)
    const properties: Property[] = []
    const creators = content.authors
    const isNSFW = content.sfw_result
    const cover = `https://mangapark.io${content.urlCoverOri}`

    properties.push({
      id: "genres",
      title: "Genres",
      tags: ALL_GENRES.filter((g) => content.genres.includes(g.id)),
    })
    properties.push({
      id: "creators",
      title: "Credits",
      tags: content.authors.map((author: string) => ({
        id: author,
        title: author,
        noninteractive: true,
      })),
    })
    return {
      title: content.name,
      cover,
      isNSFW,
      creators,
      properties,
      chapters,
    }
  }
  async getChapters(contentId: string): Promise<Chapter[]> {
    const { data } = await this.client.post("https://mangapark.io/apo/", {
      headers: {
        "content-type": "application/json",
      },
      body: {
        query: ChaptersQuery,
        variables: {
          id: contentId,
        },
      },
    })

    const chapters = JSON.parse(data).data.get_comicChapterList.map(
      // TODO: Tighten types.
      //@ts-expect-error still building
      (chapter, i) => {
        const { id, dname, dateCreate } = chapter.data
        const response = {
          chapterId: id.toString(),
          title: dname,
          number: Number(dname.split(/Chapter|Episode|Ch./i)[1]) || i,
          index: JSON.parse(data).data.get_comicChapterList.length - i,
          language: "en",
          date: new Date(dateCreate),
        }
        return response
      },
    )
    return chapters
  }
  async getChapterData(_: unknown, chapterId: string): Promise<ChapterData> {
    const { data } = await this.client.post("https://mangapark.io/apo/", {
      headers: { "content-type": "application/json" },
      body: {
        query: PagesQuery,
        variables: {
          id: chapterId,
        },
      },
    })
    const pages = JSON.parse(
      data,
      //@ts-expect-error fixxxx
    ).data?.get_chapterNode?.data?.imageFile?.urlList.map((page) => ({
      url: page,
    }))
    return { pages }
  }

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const variables = {
      select: {
        page: request.page,
        size: 30,
        word: request?.query,
        incGenres: request?.tag?.tagId ?? [
          ...(request?.filters?.general?.included || []),
          ...(request?.filters?.demographic?.included || []),
          ...(request?.filters?.adult?.included || []),
          ...(request?.filters?.content_type?.included || []),
        ],
        excGenres: [
          ...(request?.filters?.general?.excluded || []),
          ...(request?.filters?.demographic?.excluded || []),
          ...(request?.filters?.adult?.excluded || []),
          ...(request?.filters?.content_type?.excluded || []),
        ],
        incTLangs: "en",
        incOLangs: request?.filters?.language,
        sortby: request?.sort?.id,
        chapCount: request?.filters?.chapters,
        origStatus: request?.filters?.status,
      },
    }
    const response = await this.client.post("https://mangapark.io/apo/", {
      headers: {
        "content-type": "application/json",
      },
      body: {
        query: SearchQuery,
        variables,
      },
    })
    const results = JSON.parse(response.data).data.get_searchComic.items.map(
      // !TODO: Don't use any. pull from schema.
      // @ts-expect-error to be fixed
      (item) => {
        const { id, name, urlCoverOri } = item.data
        const cover = urlCoverOri ? `https://mangapark.io${urlCoverOri}` : ""
        return {
          id,
          title: name,
          cover,
        }
      },
    )
    return { results, isLastPage: results < 30 }
  }
  getFilters() {
    return [
      {
        id: "content_type",
        title: "Content Type",
        type: FilterType.EXCLUDABLE_MULTISELECT,
        options: CONTENT_TYPE,
      },
      {
        id: "demographic",
        title: "Demographics",
        type: FilterType.EXCLUDABLE_MULTISELECT,
        options: DEMOGRAPHICS,
      },
      {
        id: "adult",
        title: "Mature Genres",
        type: FilterType.EXCLUDABLE_MULTISELECT,
        options: ADULT_GENRES,
      },
      {
        id: "general",
        title: "Genres",
        type: FilterType.EXCLUDABLE_MULTISELECT,
        options: GENRES,
      },
      {
        id: "language",
        title: "Original Language",
        type: FilterType.MULTISELECT,
        options: LANGUAGE,
      },
      {
        id: "chapters",
        title: "Posted Chapters",
        type: FilterType.SELECT,
        options: CHAPTERS,
      },
      {
        id: "status",
        title: "Original Work Status",
        type: FilterType.SELECT,
        options: STATUS,
      },
      {
        id: "upload_status",
        title: "Upload Status",
        type: FilterType.SELECT,
        options: STATUS,
      },
    ]
  }
  getProperties() {
    return [
      {
        id: "content_type",
        title: "Content Type",
        tags: CONTENT_TYPE,
      },
      {
        id: "demographic",
        title: "Demographics",
        tags: DEMOGRAPHICS,
      },
      {
        id: "adult",
        title: "Mature Genres",
        tags: ADULT_GENRES,
      },
      {
        id: "general",
        title: "Genres",
        tags: GENRES,
      },
      {
        id: "language",
        title: "Original Language",
        tags: LANGUAGE,
      },
      {
        id: "chapters",
        title: "Posted Chapters",
        tags: CHAPTERS,
      },
      {
        id: "status",
        title: "Original Work Status",
        tags: STATUS,
      },
      {
        id: "upload_status",
        title: "Upload Status",
        tags: STATUS,
      },
    ]
  }

  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {
      filters: this.getFilters(),
      sort: {
        options: SORT,
        default: {
          id: "views_d000",
        },
      },
    }
  }
}
