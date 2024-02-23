import type {
  ChapterData,
  DirectoryRequest,
  DirectoryFilter,
  Form,
  PagedResult,
  Property,
  ResolvedPageSection,
  PageLink,
  PageSection,
} from "@suwatte/daisuke"

import { FilterType, UIMultiPicker, SectionStyle } from "@suwatte/daisuke"
import {
  ADULT_TAGS,
  CHAPTERS,
  CONTENT_TYPE_TAGS,
  DEMOGRAPHIC_TAGS,
  GENERIC_TAGS,
  LANG_TAGS,
  ORIGIN_TAGS,
  SORTERS,
  STATUS_TAGS,
} from "./constants"

import { Parser } from "./parser"

export class Controller {
  private BASE = "https://bato.to"
  private client = new NetworkClient()
  private parser = new Parser()
  private store = ObjectStore

  async getSearchResults(query: DirectoryRequest): Promise<PagedResult> {
    const params: Record<string, unknown> = {}
    params.langs = (await this.store.get("lang")) || "en"
    // Keyword
    if (query.query) params["word"] = query.query
    // Page
    if (query.page) params["page"] = query.page

    if (query.filters) {
      const includedTags: string[] = []
      const excludedTags: string[] = []
      for (const filter in query.filters) {
        includedTags.push(...(query.filters[filter].included || []))
        excludedTags.push(...(query.filters[filter].excluded || []))
      }
      console.log(includedTags, excludedTags)
      params.genres = `${includedTags}${
        excludedTags.length > 0 ? `|${excludedTags}` : ""
      }`
      if (query.filters.origin) params.origs = query.filters.origin.toString()
      if (query.filters.translated)
        params.langs = query.filters.translated.toString()
      if (!query.filters?.chapters) params.chapters = 1
      if (query.filters?.status) params.release = query.filters.status
      if (query?.sort) params.sort = query.sort.id
    }
    const response = await this.client.get(`${this.BASE}/browse`, {
      params,
    })
    const results = this.parser.parsePagedResponse(response.data)
    return { results, isLastPage: results.length > 60 }
  }

  getFilters(): DirectoryFilter[] {
    return [
      {
        id: "sort",
        title: "Sort By",
        type: FilterType.SELECT,
        options: SORTERS,
      },
      {
        id: "content_type",
        title: "Content Type",
        type: FilterType.EXCLUDABLE_MULTISELECT,
        options: CONTENT_TYPE_TAGS,
      },
      {
        id: "demographic",
        title: "Demographics",
        type: FilterType.EXCLUDABLE_MULTISELECT,
        options: DEMOGRAPHIC_TAGS,
      },
      {
        id: "adult",
        title: "Mature",
        type: FilterType.EXCLUDABLE_MULTISELECT,
        options: ADULT_TAGS,
      },
      {
        id: "general",
        title: "Genres",
        type: FilterType.EXCLUDABLE_MULTISELECT,
        options: GENERIC_TAGS,
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

  getProperties(): Property[] {
    return [
      // {
      //   id: "sort",
      //   title: "Sort By",
      //   tags: SORTERS,
      // },
      {
        id: "content_type",
        title: "Content Type",
        tags: CONTENT_TYPE_TAGS,
      },
      {
        id: "demographic",
        title: "Demographics",
        tags: DEMOGRAPHIC_TAGS,
      },
      {
        id: "adult",
        title: "Mature",
        tags: ADULT_TAGS,
      },
      {
        id: "general",
        title: "Genres",
        tags: GENERIC_TAGS,
      },
      {
        id: "origin",
        title: "Original Language",
        tags: ORIGIN_TAGS,
      },
      {
        id: "translated",
        title: "Translated Language",
        tags: LANG_TAGS,
      },
      {
        id: "status",
        title: "Content Status",
        tags: STATUS_TAGS,
      },
    ]
  }

  async getContent(id: string) {
    const response = await this.client.get(`${this.BASE}/series/${id}`)
    return this.parser.parseContent(response.data, id)
  }

  async getChapters(id: string) {
    const response = await this.client.get(`${this.BASE}/series/${id}`)
    return this.parser.parseChapters(response.data)
  }

  async getChapterData(chapterId: string): Promise<ChapterData> {
    const response = await this.client.get(`${this.BASE}/chapter/${chapterId}`)
    return {
      pages: this.parser.parsePages(response.data),
    }
  }

  async getHomeSections({ id }: PageLink): Promise<PageSection[]> {
    if (id === "home") {
      return [
        {
          id: "popular",
          title: "Popular Titles",
          style: SectionStyle.INFO,
        },
        {
          id: "latest",
          title: "latest Titles",
          style: SectionStyle.ITEM_LIST,
        },
      ]
    }
    throw new Error("I don't know how you got here.")
  }
  async resolveHomeSections(
    _link: PageLink,
    section: string,
  ): Promise<ResolvedPageSection> {
    const response = await this.client.get(this.BASE)
    switch (section) {
      case "popular":
        return {
          items: (await this.parser.parsePopular(response.data)).results,
        }
      case "latest":
        return {
          items: (await this.parser.parseLatest(response.data)).results,
        }
      default:
        throw new Error("Something went horribly wrong.")
    }
  }

  async getPreferences(): Promise<Form> {
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
              didChange: (value) => this.store.set("lang", value),
            }),
          ],
        },
      ],
    }
  }
}
