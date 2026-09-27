import { ContentRating, type SourceInfo } from "@suwatte/toolchain/types"
import { LegacyDelegateAdapter } from "../../shared/legacy-adapter"
import { Target as LegacyReadComicsOnline } from "../../runners/ReadComicsOnline"

export default class ReadComicsOnline extends LegacyDelegateAdapter {
  static info: SourceInfo = { id: "en.readcomicsonline", name: "ReadComicsOnline", version: 1, website: "https://readcomicsonline.ru", thumbnail: "readcomiconline.png", languages: ["en"], rating: ContentRating.MATURE, minSupportedAppVersion: "7.0.0" }
  constructor() { super(new LegacyReadComicsOnline(), ContentRating.MATURE) }
}
