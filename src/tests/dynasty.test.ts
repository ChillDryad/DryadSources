import emulate from "@suwatte/emulator"

import { Target } from "../runners/DynastyScans"
import {
  PagedResultSchema,
  ContentSchema,
  ChapterSchema,
  ChapterDataSchema,
} from "@suwatte/validate"

describe("Dynasty tests", () => {
  const source = emulate(Target)

  test("Query", async () => {
    const data = await source.getDirectory({
      page: 1,
    })
    expect(PagedResultSchema.parse(data)).toEqual(expect.any(Object))
    expect(data.results.length).toBe(20)
  }, 14000)

  test("Content", async () => {
    const content = await source.getContent(
      "the_guy_she_was_interested_in_wasnt_a_guy_at_all",
    )
    expect(ContentSchema.parse(content)).toEqual(expect.any(Object))
    expect(content.title).toBe(
      "The Guy She Was Interested in Wasn't a Guy At All",
    )
  })

  test("Chapters", async () => {
    const chapters = await source.getChapters(
      "the_guy_she_was_interested_in_wasnt_a_guy_at_all",
    )
    expect(ChapterSchema.array().parse(chapters)).toEqual(expect.any(Array))
    expect(chapters.length).toBeGreaterThan(1)
  })

  test("Reader", async () => {
    const data = await source.getChapterData(
      "",
      "the_guy_she_was_interested_in_wasnt_a_guy_at_all_ch00",
    )
    expect(ChapterDataSchema.parse(data)).toEqual(expect.any(Object))
  })
})
