import assert from "node:assert/strict"
import test, { beforeEach } from "node:test"

import emulate, {
  resetEmulatorRuntime,
  resetEmulatorStores,
} from "@suwatte/toolchain/emulator"
import {
  ContentSchema,
  PagedItemListSchema,
} from "@suwatte/toolchain/validate"
import Atsumaru from "../src/sources/atsumaru-en/index"

beforeEach(() => {
  resetEmulatorRuntime()
  resetEmulatorStores()
})

test("Atsumaru exposes a schema-valid trending list", async () => {
  const source = emulate(Atsumaru)
  const page = await source.getItemList({ key: "trending" }, 1)

  PagedItemListSchema.parse(page)
  assert.ok(page.items.length > 0)
  assert.ok(page.items[0].coverImage)
})

test("Atsumaru resolves an item into readable chapter pages", async () => {
  const source = emulate(Atsumaru)
  const listing = await source.getItemList({ key: "trending" }, 1)
  const item = listing.items[0]
  assert.ok(item)

  const content = await source.getContent(item.id)
  ContentSchema.parse(content)
  assert.ok(content.chapters?.length)

  const chapter = content.chapters![0]
  const pages = await source.getChapterPages!(item.id, chapter.id)
  assert.ok(pages.length > 0)
  assert.ok(pages.every((page) => page.url?.startsWith("https://")))
})
