import assert from "node:assert/strict"
import test from "node:test"

import Atsumaru from "../src/sources/atsumaru-en/index"
import Comix from "../src/sources/comix-en/index"
import DynastyScans from "../src/sources/dynasty-scans-en/index"
import Hiperdex from "../src/sources/hiperdex-pt/index"
import Manga18FX from "../src/sources/manga18fx-en/index"
import MangaBall from "../src/sources/manga-ball-en/index"
import MangaGo from "../src/sources/mangago-en/index"
import NHentai from "../src/sources/nhentai-en/index"
import OmegaScans from "../src/sources/omega-scans-en/index"
import ReadComicsOnline from "../src/sources/read-comics-online-en/index"
import XoxoComic from "../src/sources/xoxo-comic-en/index"

const sources = [
  Atsumaru,
  Comix,
  DynastyScans,
  Hiperdex,
  Manga18FX,
  MangaBall,
  MangaGo,
  NHentai,
  OmegaScans,
  ReadComicsOnline,
  XoxoComic,
]

test("every migrated reader source has a v7 delegate entrypoint", () => {
  assert.equal(sources.length, 11)
  assert.deepEqual(
    sources.map((source) => source.info.id).sort(),
    [
      "en.atsumaru",
      "en.comix",
      "en.dynastyscans",
      "en.manga18fx",
      "en.mangaball",
      "en.mangago",
      "en.nhentai",
      "en.omegascans",
      "en.readcomicsonline",
      "en.xoxocomic",
      "pt.hiperdex",
    ],
  )

  for (const source of sources) {
    assert.ok(source.info.website.startsWith("https://"))
    assert.ok(source.info.languages.length > 0)
    assert.equal(typeof source.prototype.getSearchResults, "function")
    assert.equal(typeof source.prototype.getItemList, "function")
    assert.equal(typeof source.prototype.getContent, "function")
  }
})
