import {
  ContentRating,
  type Content,
  type ItemListRequest,
  type PagedItemList,
  type SearchRequest,
  type SourceConfiguration,
  type SourceInfo,
} from "@suwatte/toolchain/types"
import { LegacyDelegateAdapter } from "../../shared/legacy-adapter"
import { Target as LegacyMangaGo } from "../../runners/mangago"

export default class MangaGo extends LegacyDelegateAdapter {
  static info: SourceInfo = {
    id: "en.mangago",
    name: "MangaGo",
    version: 1,
    website: "https://www.mangago.me",
    thumbnail: "mangago.png",
    languages: ["en"],
    rating: ContentRating.MATURE,
    minSupportedAppVersion: "7.0.0",
  }

  private readonly challengeClient = new HttpClient({
    baseUrl: "https://www.mangago.me",
    cloudflareResolutionURL: "https://www.mangago.me/",
  })

  constructor() {
    super(new LegacyMangaGo(), ContentRating.MATURE)
  }

  getConfiguration(): SourceConfiguration {
    return {
      ...super.getConfiguration(),
      cloudflareResolutionURL: "https://www.mangago.me/",
    }
  }

  async getSearchResults(request: SearchRequest, page: number): Promise<PagedItemList> {
    await this.assertChallengeResolved()
    return super.getSearchResults(request, page)
  }

  async getItemList(request: ItemListRequest, page: number): Promise<PagedItemList> {
    await this.assertChallengeResolved()
    return super.getItemList(request, page)
  }

  async getContent(contentId: string): Promise<Content> {
    await this.assertChallengeResolved()
    return super.getContent(contentId)
  }

  private async assertChallengeResolved(): Promise<void> {
    const response = await this.challengeClient.get("/")
    if (!response.ok) throw new Error(`MangaGo verification failed: HTTP ${response.status}`)
  }
}
