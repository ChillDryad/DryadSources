import { CatalogRating, RunnerInfo } from "@suwatte/daisuke"
import { TachiBuilder } from "../../templates/tachiyomi"
import { TachiDaraTemplate } from "../../templates/tachidara"

const info: RunnerInfo = {
  id: "kusa.hiperdex",
  name: "Hiperdex",
  thumbnail: "hiperdex.png",
  version: 0.3,
  rating: CatalogRating.NSFW,
  website: "https://hiperdex.com",
}

class Hiperdex extends TachiDaraTemplate {
  baseUrl = "https://hiperdex.com"
  lang = "en"
  name = info.name

  protected searchPage(page: number): string {
    return page == 1 ? "" : `page/${page}/`
  }

  protected useNewChapterEndpoint = true
}

export const Target = new TachiBuilder(info, Hiperdex)
