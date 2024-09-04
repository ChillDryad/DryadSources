import {
  CatalogRating,
  Chapter,
  ChapterData,
  Content,
  ContentSource,
  DeepLinkContext,
  DirectoryConfig,
  DirectoryRequest,
  PagedResult,
  Property,
  RunnerInfo,
  SourceConfig,
} from "@suwatte/daisuke"

export class Target implements ContentSource {
  baseUrl = "https://manga18fx.com/"
  info: RunnerInfo = {
    id: "kusa.manga18fx",
    name: "Manga18FX",
    thumbnail: "manga18fx.png", //todo: get
    version: 0.1,
    website: this.baseUrl,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.NSFW,
  }
  getContent(contentId: string): Promise<Content> {
    throw new Error("Method not implemented.")
  }
  getChapters(contentId: string): Promise<Chapter[]> {
    throw new Error("Method not implemented.")
  }
  getChapterData(contentId: string, chapterId: string): Promise<ChapterData> {
    throw new Error("Method not implemented.")
  }
  getTags?(): Promise<Property[]> {
    throw new Error("Method not implemented.")
  }
  getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    throw new Error("Method not implemented.")
  }
  getDirectoryConfig(configID?: string): Promise<DirectoryConfig> {
    throw new Error("Method not implemented.")
  }
}
