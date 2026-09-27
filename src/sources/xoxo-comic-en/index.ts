import { ContentRating, type SourceInfo } from "@suwatte/toolchain/types"
import { LegacyDelegateAdapter } from "../../shared/legacy-adapter"
import { Target as LegacyXoxoComic } from "../../runners/xoxocomic"

export default class XoxoComic extends LegacyDelegateAdapter {
  static info: SourceInfo = { id: "en.xoxocomic", name: "XoxoComic", version: 1, website: "https://xoxocomic.com", thumbnail: "xoxo.png", languages: ["en"], rating: ContentRating.MATURE, minSupportedAppVersion: "7.0.0" }
  constructor() { super(new LegacyXoxoComic(), ContentRating.MATURE) }
}
