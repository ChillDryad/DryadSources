import { ContentRating, type SourceInfo } from "@suwatte/toolchain/types"
import { LegacyDelegateAdapter } from "../../shared/legacy-adapter"
import { Target as LegacyManga18FX } from "../../runners/manga18fx"

export default class Manga18FX extends LegacyDelegateAdapter {
  static info: SourceInfo = { id: "en.manga18fx", name: "Manga18FX", version: 1, website: "https://manga18fx.com", thumbnail: "manga18fx.jpg", languages: ["en"], rating: ContentRating.MATURE, minSupportedAppVersion: "7.0.0" }
  constructor() { super(new LegacyManga18FX(), ContentRating.MATURE) }
}
