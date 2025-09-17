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
} from "@suwatte/daisuke"
import { CatalogRating, FilterType, NetworkClientBuilder, ReadingMode, UIMultiPicker } from "@suwatte/daisuke"
import { load } from "cheerio"
import { chapter_query, content, directory } from "./gql"
import { directory_variables } from "./gql/variables"
import { ADULT_GENRES, ALL_GENRES, CHAPTERS, CONTENT_TYPE, DEMOGRAPHICS, GENERIC_TAGS, GENRES, LANG_TAGS, ORIGIN_TAGS, sort, STATUS_TAGS } from "./constants"
import { AES, enc } from "crypto-js"

// import { GlobalStore } from "./store"

export class Target implements ContentSource {
  info: RunnerInfo = {
    id: "kusa.batogql",
    name: "Bato v3x",
    version: 0.1,
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

  // TODO: Make sure we only include tags for supported filters.
  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    console.log(request)
    const includedTags: string[] = request?.filters ? [] : await this.store.stringArray("include")
    const excludedTags: string[] = request?.filters ? [] : await this.store.stringArray("exclude") 
    if (request.filters) {
      for (const filter in request.filters) {
        try {
          includedTags.push(...(request.filters[filter].included))
          excludedTags.push(...(request.filters[filter].excluded))
        } catch (e) {
          return
        }
      }
    }
    console.log("chap: ", request?.filters?.chapters)
    const { data } = await this.client.post(this.queryUrl, {
      headers: {
        "content-type": "application/json",
      },
      body: {
        query: directory,
        variables: directory_variables({
          page: request.page,
          word: request?.query,
          sort: request.sort?.id,
          incGenres: includedTags,
          excGenres: excludedTags,
          incTLangs: await this.store.stringArray("lang"),
          incOLangs: request.filters?.origin,
          // chapCount: request.filters?.chapters
        }),
      },
    })

    const items = JSON.parse(data).data.get_content_searchComic.items
    const results = items.map(
      (item: { id: string; data: { name: string; urlCoverOri: string } }) => ({
        id: item.id,
        title: item.data.name,
        cover: item.data.urlCoverOri,
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
    if (details.readDirection === "Top to Bottom")
      recommendedPanelMode = ReadingMode.WEBTOON
    else if (details.readDirection === "Left to Right")
      recommendedPanelMode = ReadingMode.PAGED_COMIC

    let status: PublicationStatus | undefined
    if(details.uploadStatus) {
      if (details.uploadStatus.includes("Ongoing")) status = PublicationStatus.ONGOING
      if (details.uploadStatus.includes("Cancelled")) status = PublicationStatus.CANCELLED
      if (details.uploadStatus.includes("Hiatus")) status = PublicationStatus.HIATUS
      if (details.uploadStatus.includes("Completed")) status = PublicationStatus.COMPLETED
    }
    return {
      title: details.name,
      cover: details.urlCover600,
      summary: details.summary.text,
      creators: [...details.authors, ...details.artists],
      additionalTitles: details.altNames,
      webUrl: `${this.baseUrl}/${details.urlPath}`,
      recommendedPanelMode,
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
        return {
          chapterId: data.urlPath,
          number: chapterData.length - 1 - i,
          index: i,
          title: data.dname,
          date: new Date(data.datePublic),
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
      // {
      //   id: "chapters",
      //   title: "Uploaded Chapters",
      //   type: FilterType.SELECT,
      //   options: CHAPTERS,
      // },
    ]
  }

    async getPreferenceMenu(): Promise<Form> {
      const languages = ORIGIN_TAGS.map((l) => ({ id: l.id, title: l.title }))
      return {
        sections: [
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
                  console.log(value)
                  console.log(this.store.set("lang", value))
                  return this.store.set("lang", value)
                },
              }),
            ],
          },
          {
            // Include
            header: "Default Included Genres",
            children: [
              UIMultiPicker({
                id: "include",
                title: "Include",
                options: ALL_GENRES,
                value: await this.store.stringArray("include"),
                didChange: (v) => this.store.set("include", v),
              }),
            ],
          },
          {
            // Exclude
            header: "Default Excluded Genres",
            children: [
              UIMultiPicker({
                id: "exclude",
                title: "Exclude",
                options: ALL_GENRES,
                value: await this.store.stringArray("exclude"),
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
