import type {
  Chapter,
  ChapterData,
  Content,
  ContentSource,
  DirectoryConfig,
  DirectoryRequest,
  NetworkRequest,
  PageLink,
  PageSection,
  PagedResult,
  RunnerInfo,
} from "@suwatte/daisuke"

import { CatalogRating, SectionStyle } from "@suwatte/daisuke"

import Controller from "./controller"
import { BASE_URL, SORT } from "./constants"

export class Target implements ContentSource {
  info: RunnerInfo = {
    id: "com.toonily",
    name: "Toonily",
    thumbnail: "toonily.png",
    version: 1.6,
    website: BASE_URL,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.MIXED,
    minSupportedAppVersion: "5.0",
  }

  private controller = new Controller()

  getContent(contentId: string): Promise<Content> {
    return this.controller.getContent(contentId)
  }
  getChapters(contentId: string): Promise<Chapter[]> {
    return this.controller.getChapters(contentId)
  }
  getChapterData(_contentId: string, chapterId: string): Promise<ChapterData> {
    return this.controller.getChapterData(chapterId)
  }

  getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    return this.controller.getSearchResults(request)
  }

  // Think of this like an interceptor but specifically for image requests
  // Yes it does make me cry at night.
  async willRequestImage(url: string): Promise<NetworkRequest> {
    return {
      url,
      headers: { Referer: `${BASE_URL}/` },
      cookies: [{ name: "toonily-lazyload", value: "off" }],
    }
  }

  async getSectionsForPage(page: PageLink): Promise<PageSection[]> {
    if (page.id === "home") {
      const sections: PageSection[] = [
        {
          id: "popular",
          title: "Popular Titles",
          style: SectionStyle.GALLERY,
        },
        {
          id: "latest",
          title: "Latest Titles",
          style: SectionStyle.PADDED_LIST,
        },
      ]
      return sections
    }
    throw new Error("I don't know how you got here.")
  }

  async getDirectoryConfig(
    _configID?: string | undefined,
  ): Promise<DirectoryConfig> {
    return {
      filters: this.controller.getFilters(),
      sort: {
        options: SORT,
        canChangeOrder: false,
        default: {
          id: "trending",
        },
      },
    }
  }
}
