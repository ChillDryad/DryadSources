import assert from "node:assert/strict"
import test, { beforeEach } from "node:test"

import emulate, {
  CloudflareError,
  resetEmulatorRuntime,
  resetEmulatorStores,
} from "@suwatte/toolchain/emulator"
import MangaGo from "../src/sources/mangago-en/index"

beforeEach(() => {
  resetEmulatorRuntime()
  resetEmulatorStores()
})

test("MangaGo reports Cloudflare to Suwatte instead of leaking a parser error", async () => {
  const source = emulate(MangaGo)
  await assert.rejects(
    () => source.getItemList({}, 1),
    (error: unknown) => error instanceof CloudflareError,
  )
})
