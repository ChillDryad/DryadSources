import { ContentRating, type SourceInfo } from "@suwatte/toolchain/types"
import { LegacyDelegateAdapter } from "../../shared/legacy-adapter"
import { Target as LegacyComix } from "../../runners/Comix"

export default class Comix extends LegacyDelegateAdapter {
  static info: SourceInfo = { id: "en.comix", name: "Comix", version: 1, website: "https://comix.to", thumbnail: "comix.png", languages: ["en"], rating: ContentRating.MATURE, minSupportedAppVersion: "7.0.0" }
  constructor() { super(new LegacyComix(), ContentRating.MATURE) }
}
