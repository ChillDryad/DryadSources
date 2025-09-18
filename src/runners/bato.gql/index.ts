import {
  Chapter,
  ChapterData,
  Content,
  ContentSource,
  DeepLinkContext,
  DirectoryConfig,
  DirectoryRequest,
  Form,
  PagedResult,
  Property,
  PublicationStatus,
  RunnerInfo,
  SourceConfig,
  type Highlight
} from "@suwatte/daisuke"
import { CatalogRating, FilterType, NetworkClientBuilder, ReadingMode, UIMultiPicker, UIToggle } from "@suwatte/daisuke"
import { load } from "cheerio"
import { chapter_query, content, directory } from "./gql"
import { directory_variables } from "./gql/variables"
import { 
  ADULT_GENRES, 
  ALL_GENRES, 
  CHAPTERS, 
  CONTENT_TYPE, 
  DEMOGRAPHICS, 
  GENRES, 
  LANG_TAGS, 
  ORIGIN_TAGS, 
  sort, 
  STATUS_TAGS 
} from "./constants"
import { AES, enc } from "crypto-js"

// import { GlobalStore } from "./store"

export class Target implements ContentSource {
  info: RunnerInfo = {
    id: "kusa.batogql",
    name: "Bato v3x",
    version: 0.6,
    website: "https://bato.to/",
    supportedLanguages: LANG_TAGS.map(l => l.id),
    thumbnail: "bato.png",
    minSupportedAppVersion: "5.0",
    rating: CatalogRating.MIXED,
  }

  baseUrl = "https://bato.to"
  queryUrl = `${this.baseUrl}/apo/`
  client = new NetworkClient()

  store = ObjectStore

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const nsfwEnabled = await this.store.boolean("nsfw")
    const genFilters = request.filters
    const includedTags: string[] = genFilters
      ? [
          ...(genFilters["content_type"]?.included ?? []),
          ...(genFilters["demographic"]?.included ?? []),
          ...(genFilters["adult"]?.included ?? []),
          ...(genFilters["general"]?.included ?? []),
        ]
      : await this.store.stringArray("include")
    const excludedTags: string[] = genFilters
      ? [
          ...(genFilters["content_type"]?.excluded ?? []),
          ...(genFilters["demographic"]?.excluded ?? []),
          ...(genFilters["adult"]?.excluded ?? []),
          ...(genFilters["general"]?.excluded ?? []),
        ] 
      : await this.store.stringArray("exclude")
    const language = await this.store.stringArray("lang")
    const browseVars = directory_variables({
      page: request.page,
      word: request?.query,
      sort: request.sort?.id,
      incOLangs: request.filters?.origin,
      chapCount: request.filters?.chapters,
      excGenres: nsfwEnabled ? [...excludedTags] : [...ADULT_GENRES.map(a => a.title), ...(excludedTags || [])],
      incGenres: includedTags,
      incTLangs: language,
    })
    const searchVars = directory_variables({
      page: request.page,
      word: request?.query,
      sort: request.sort?.id,
      incOLangs: request.filters?.origin,
      excGenres: nsfwEnabled
        ? [...excludedTags]
        : [...ADULT_GENRES.map((a) => a.title), ...(excludedTags || [])],
      incTLangs: language,
    })
    const { data } = await this.client.post(this.queryUrl, {
      headers: {
        "content-type": "application/json",
      },
      body: {
        query: directory,
        variables: request?.query ? searchVars : browseVars,
      },
    })

    const items = JSON.parse(data).data.get_content_searchComic.items
    const results:Highlight[] = items.map(
      (item: {
        id: string
        data: { name: string; urlCoverOri: string; genres: string[] }
      }) => ({
        id: item.id,
        title: item.data.name,
        cover: item.data.urlCoverOri,
        isNSFW:
          ADULT_GENRES.filter((a) =>
            item.data.genres.includes(a.title),
          ).length > 1,
      }),
    )
    return {
      results,
      isLastPage: results.length < 25,
    }
  }

  async getContent(contentId: string): Promise<Content> {
    const { data } = await this.client.post(this.queryUrl, {
      headers: {
        "content-type": "application/json",
      },
      body: {
        query: content,
        variables: {"manga": contentId},
      }
    })
    const details = JSON.parse(data).data.get_content_comicNode.data
    const properties: Property[] = []
    properties.push({
      id: "genres",
      title: "Genres",
      tags: ALL_GENRES.filter(v => details.genres.includes(v.title))
    })
    let recommendedPanelMode = ReadingMode.PAGED_MANGA
    if (details.readDirection === "ttb")
      recommendedPanelMode = ReadingMode.WEBTOON
    else if (details.readDirection === "ltr")
      recommendedPanelMode = ReadingMode.PAGED_COMIC

    let status: PublicationStatus | undefined
    if(details.uploadStatus) {
      if (details.uploadStatus.includes("ongoing")) status = PublicationStatus.ONGOING
      if (details.uploadStatus.includes("cancelled")) status = PublicationStatus.CANCELLED
      if (details.uploadStatus.includes("hiatus")) status = PublicationStatus.HIATUS
      if (details.uploadStatus.includes("completed")) status = PublicationStatus.COMPLETED
    }
    return {
      title: details.name,
      cover: details.urlCover600,
      summary: details.summary.text,
      creators: [...details.authors, ...details.artists],
      additionalTitles: details.altNames,
      webUrl: `${this.baseUrl}${details.urlPath}`,
      recommendedPanelMode,
      isNSFW:
        ADULT_GENRES.filter((a) => details.genres.includes(a.title)).length >
        1,
      status,
      properties,
    }
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    const { data } = await this.client.post(this.queryUrl, {
      headers: {
        "content-type": "application/json",
      },
      body: {
        query: chapter_query,
        variables: { manga: contentId },
      },
    })
    const chapterData = JSON.parse(data).data.get_content_chapterList
    const language = JSON.parse(data).data.get_content_comicNode.data.tranLang
    const chapters: Chapter[] = chapterData
      .reverse()
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      .map((chapter: any, i: number) => {
        const { data } = chapter
        const chapterPages = {pages: data.imageFiles?.map((file:any) => ({url: file}))}
        return {
          chapterId: data.id,
          number: chapterData.length - i,
          index: i,
          title: data.dname,
          date: new Date(data.datePublic),
          data: chapterPages.pages ? chapterPages : undefined,
          language,
        }
      })
    return chapters
  }

  async getChapterData(
    _contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const res = await this.client.get(`${this.baseUrl}/chapter/${chapterId}`)
    const $ = load(res.data)
    const script = $("script:contains('const batoWord =')")?.html()

    if (!script) throw new Error("Could not find script with image data.")

    const imgHttpLisString = script
      .split("const imgHttps = ")
      .pop()
      ?.split(";")?.[0]
      .trim()

    if (!imgHttpLisString) throw new Error("Image List Not Found.")

    const imgHttpList: string[] = JSON.parse(imgHttpLisString)
    const batoWord = script
      .split("const batoWord = ")
      .pop()
      ?.split(";")?.[0]
      .replace(/"/g, "")
    const batoPass = script.split("const batoPass = ").pop()?.split(";")?.[0]
    if (!batoWord || !batoPass || !imgHttpList || imgHttpList.length == 0)
      throw new Error("Bad State")

    const evaluatedPass = eval(batoPass).toString()
    const imgAccListString = AES.decrypt(batoWord, evaluatedPass).toString(enc.Utf8)
    const imgAccList: string[] = JSON.parse(imgAccListString)
    return {
      pages: imgHttpList.map((v, i) => ({ url: `${v}?${imgAccList[i]}` })),
    } 
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
        title: "Mature",
        subtitle: "Must be enabled in source settings (settings => installed runners => bato v3x)",
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
        id: "origin",
        title: "Original Language",
        type: FilterType.MULTISELECT,
        options: ORIGIN_TAGS,
      },
      {
        id: "translated",
        title: "Translated Language",
        subtitle:
          "NOTE: When Selected, This will override your language preferences",
        type: FilterType.MULTISELECT,
        options: LANG_TAGS,
      },
      {
        id: "status",
        title: "Content Status",
        type: FilterType.SELECT,
        options: STATUS_TAGS,
      },
      {
        id: "chapters",
        title: "Uploaded Chapters",
        type: FilterType.SELECT,
        options: CHAPTERS,
      },
    ]
  }

    async getPreferenceMenu(): Promise<Form> {
      const languages = ORIGIN_TAGS.map((l) => ({ id: l.id, title: l.title }))
      return {
        sections: [
          {
            // NSFW
            header: "Enable NSFW content?",
            children: [
              UIToggle({
                id: "language",
                title: "Enable NSFW content",
                value: (await this.store.boolean("nsfw")) || false,
                didChange: (value: boolean) => {
                  return this.store.set("nsfw", value)
                },
              }),
            ],
          },
          {
            // LANGUAGE OPTIONS
            header: "Language Options",
            children: [
              UIMultiPicker({
                id: "language",
                title: "Default Language",
                options: languages,
                value: (await this.store.stringArray("lang")) || ["en"],
                didChange: (value) => {
                  return this.store.set("lang", value)
                },
              }),
            ],
          },
          {
            // Default Filters
            header: "Default Filters",
            children: [
              UIMultiPicker({
                id: "include",
                title: "Include",
                options: ALL_GENRES,
                value: await this.store.stringArray("include") || [],
                didChange: (v) => this.store.set("include", v),
              }),
              UIMultiPicker({
                id: "exclude",
                title: "Exclude",
                options: ALL_GENRES,
                value: await this.store.stringArray("exclude") || [],
                didChange: (v) => this.store.set("exclude", v),
              }),
            ],
          },
        ],
      }
    }
  
  async getDirectoryConfig(
    _configID?: string | undefined,
  ): Promise<DirectoryConfig> {
    return {
      filters: this.getFilters(),
      sort: {
        options: sort,
        canChangeOrder: false
      }
    }
  }
}
