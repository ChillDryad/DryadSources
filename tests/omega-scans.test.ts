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
import OmegaScans from "../src/sources/omega-scans-en/index"

beforeEach(() => {
  resetEmulatorRuntime()
  resetEmulatorStores()
})

test("OmegaScans returns schema-valid content through the v7 emulator", async () => {
  const source = emulate(OmegaScans)
  const listing = await source.getItemList({}, 1)
  PagedItemListSchema.parse(listing)
  assert.ok(listing.items.length > 0)

  const content = await source.getContent(listing.items[0].id)
  ContentSchema.parse(content)
  assert.ok(content.chapters?.length)

  const pages = await source.getChapterPages!(
    listing.items[0].id,
    content.chapters![0].id,
  )
  assert.ok(pages.length > 0)
})
