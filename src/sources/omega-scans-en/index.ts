import { ContentRating, type SourceInfo } from "@suwatte/toolchain/types"
import { LegacyDelegateAdapter } from "../../shared/legacy-adapter"
import { Target as LegacyOmegaScans } from "../../runners/OmegaScans"

export default class OmegaScans extends LegacyDelegateAdapter {
  static info: SourceInfo = {
    id: "en.omegascans",
    name: "OmegaScans",
    version: 1,
    website: "https://omegascans.org",
    thumbnail: "omega.png",
    languages: ["en"],
    rating: ContentRating.MATURE,
    minSupportedAppVersion: "7.0.0",
  }

  constructor() {
    super(new LegacyOmegaScans(), ContentRating.MATURE)
  }
}
