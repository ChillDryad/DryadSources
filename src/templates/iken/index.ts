import type {
  Chapter,
  ChapterData,
  Content,
  DeepLinkContext,
  DirectoryConfig,
  DirectoryRequest,
  PagedResult,
  Property,
  RunnerInfo,
  SourceConfig,
} from "@suwatte/daisuke"

export abstract class IkenTemplate {
  constructor(params: Record<string,string>) {
    
  }
  onEnvironmentLoaded?(): Promise<void> {
    throw new Error("Method not implemented.")
  }
  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    return { results: [], isLastPage: true }
  }
  async getContent(contentId: string): Promise<Content> {
    return { title: "foo", cover: "bar" }
  }
  async getChapters(contentId: string): Promise<Chapter[]> {
    return []
  }
  async getChapterData(
    _contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    return {}
  }

  getTags?(): Promise<Property[]> {
    throw new Error("Method not implemented.")
  }
  // async getPreferenceMenu(): Promise<Form> {
  //   return this.controller.getPreferences()
  // }
  async getDirectoryConfig(
    _configID?: string | undefined,
  ): Promise<DirectoryConfig> {
    return {
      // filters: this.controller.getFilters(),
      // sort: {
      //   options: SORTERS,
      //   canChangeOrder: true,
      // },
    }
  }
}
