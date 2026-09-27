import { ContentRating, type SourceInfo } from "@suwatte/toolchain/types"
import { LegacyDelegateAdapter } from "../../shared/legacy-adapter"

declare const require: (path: string) => { Target: object }

export default class Hiperdex extends LegacyDelegateAdapter {
  static info: SourceInfo = { id: "pt.hiperdex", name: "Hiperdex", version: 1, website: "https://hipertoon.com", thumbnail: "hiperdex.png", languages: ["pt-BR"], rating: ContentRating.MATURE, minSupportedAppVersion: "7.0.0" }
  constructor() { super(require("../../runners/hiperdex").Target, ContentRating.MATURE) }
}
