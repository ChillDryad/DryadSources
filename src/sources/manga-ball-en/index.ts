import { ContentRating, type SourceInfo } from "@suwatte/toolchain/types"
import { LegacyDelegateAdapter } from "../../shared/legacy-adapter"
import { Target as LegacyMangaBall } from "../../runners/MangaBall"

export default class MangaBall extends LegacyDelegateAdapter {
  static info: SourceInfo = { id: "en.mangaball", name: "MangaBall", version: 1, website: "https://mangaball.net", thumbnail: "mangaball.png", languages: ["en"], rating: ContentRating.MATURE, minSupportedAppVersion: "7.0.0" }
  constructor() { super(new LegacyMangaBall(), ContentRating.MATURE) }
}
