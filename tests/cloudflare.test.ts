import assert from "node:assert/strict"
import test from "node:test"

import emulate, { CloudflareError } from "@suwatte/toolchain/emulator"
import Comix from "../src/sources/comix-en/index"
import MangaGo from "../src/sources/mangago-en/index"
import NHentai from "../src/sources/nhentai-en/index"
import ReadComicsOnline from "../src/sources/read-comics-online-en/index"

for (const [name, Source] of [
  ["Comix", Comix],
  ["MangaGo", MangaGo],
  ["NHentai", NHentai],
  ["ReadComicsOnline", ReadComicsOnline],
] as const) {
  test(`${name} surfaces Cloudflare through the v7 emulator`, async () => {
    const source = emulate(Source)
    await assert.rejects(
      () => source.getItemList({}, 1),
      (error: unknown) => error instanceof CloudflareError,
    )
  })
}
