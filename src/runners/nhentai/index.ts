import {
  CatalogRating,
  type Chapter,
  type ChapterData,
  type Content,
  type ContentSource,
  type DirectoryConfig,
  type DirectoryRequest,
  type PagedResult,
  type RunnerInfo,
} from "@suwatte/daisuke"

import { Controller } from "./controller"

export class Target implements ContentSource {
  info: RunnerInfo = {
    id: "net.nhentai",
    name: "nHentai",
    version: 0.8,
    website: "https://nhentai.net",
    supportedLanguages: ["EN_GB", "JA", "ZH"],
    thumbnail: "nhentai.png",
    rating: CatalogRating.NSFW,
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
  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {
      filters: this.controller.getFilters(),
    }
  }
}
