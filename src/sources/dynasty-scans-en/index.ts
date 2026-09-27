import { ContentRating, type SourceInfo } from "@suwatte/toolchain/types"
import { LegacyDelegateAdapter } from "../../shared/legacy-adapter"
import { Target as LegacyDynastyScans } from "../../runners/DynastyScans"

export default class DynastyScans extends LegacyDelegateAdapter {
  static info: SourceInfo = { id: "en.dynastyscans", name: "DynastyScans", version: 1, website: "https://dynasty-scans.com", thumbnail: "dynasty.png", languages: ["en"], rating: ContentRating.MATURE, minSupportedAppVersion: "7.0.0" }
  constructor() { super(new LegacyDynastyScans(), ContentRating.MATURE) }
}
