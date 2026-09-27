import { ContentRating, type SourceInfo } from "@suwatte/toolchain/types"
import { LegacyDelegateAdapter } from "../../shared/legacy-adapter"
import { Target as LegacyNHentai } from "../../runners/nhentai"

export default class NHentai extends LegacyDelegateAdapter {
  static info: SourceInfo = { id: "en.nhentai", name: "NHentai", version: 1, website: "https://nhentai.net", thumbnail: "nhentai.png", languages: ["en"], rating: ContentRating.MATURE, minSupportedAppVersion: "7.0.0" }
  constructor() { super(new LegacyNHentai(), ContentRating.MATURE) }
}
