import {
  ChapterData,
  DirectoryFilter,
  DirectoryRequest,
  FilterType,
  PagedResult,
  Property,
} from "@suwatte/daisuke";
import {
  ADULT_TAGS,
  CONTENT_TYPE_TAGS,
  DEMOGRAPHIC_TAGS,
  GENERIC_TAGS,
  LANG_TAGS,
  ORIGIN_TAGS,
  STATUS_TAGS,
} from "./constants";
import { Parser } from "./parser";
export class Controller {
  private BASE = "https://bato.to";
  private client = new NetworkClient();
  private parser = new Parser();

  async getSearchResults(query: DirectoryRequest): Promise<PagedResult> {
    const params: Record<string, any> = {};
    // Keyword
    if (query.query) params["word"] = query.query;
    // Page
    if (query.page) params["page"] = query.page;

    if (query.filters !== undefined) {
      const includedTags: string[] = [];
      const excludedTags: string[] = [];
      for (const filter in query.filters) {
        includedTags.push.apply(includedTags, query.filters[filter].included);
        excludedTags.push.apply(excludedTags, query.filters[filter].excluded);
      }
      params.genres = `${includedTags}|${excludedTags}`;
      if (query.filters.origin) params.origs = query.filters.origin;
      if (query.filters.translated) params.langs = query.filters.translated;
    }

    params.sort = query.sort ?? "";
    const response = await this.client.get(`${this.BASE}/browse`, {
      params,
    });
    const results = this.parser.parsePagedResponse(response.data);
    return { results, isLastPage: results.length > 60 };
  }

  getFilters(): DirectoryFilter[] {
    return [
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
    ];
  }

  getProperties(): Property[] {
    return [
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
    ];
  }

  async getContent(id: string) {
    const response = await this.client.get(`${this.BASE}/series/${id}`);
    return this.parser.parseContent(response.data, id);
  }

  async getChapters(id: string) {
    const response = await this.client.get(`${this.BASE}/series/${id}`);
    return this.parser.parseChapters(response.data);
  }

  async getChapterData(chapterId: string): Promise<ChapterData> {
    const response = await this.client.get(`${this.BASE}/chapter/${chapterId}`);
    return {
      pages: this.parser.parsePages(response.data),
    };
  }
}
