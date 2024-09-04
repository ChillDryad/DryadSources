import { Target } from "../runners/manga18fx"
import emulate from "@suwatte/emulator"
import {
  PagedResultSchema,
  ContentSchema,
  ChapterSchema,
  ChapterDataSchema,
} from "@suwatte/validate"

describe("Manga18fx tests", () => {
  const source = emulate(Target)

  test("Query", async () => {
    const data = await source.getDirectory({
      page: 1,
      query: "app",
    })
    expect(PagedResultSchema.parse(data)).toEqual(expect.any(Object))
    expect(data.results.length).toBeGreaterThan(1)
  })
  // test("Content", async () => {
  //   const content = await source.getContent("bunking-bed-raw")
  //   expect(ContentSchema.parse(content)).toEqual(expect.any(Object))
  //   expect(content.title).toBe("Bunking Bed Raw")
  // })
  test("Chapters", async () => {
    const chapters = await source.getChapters("bunking-bed-raw")
    expect(ChapterSchema.array().parse(chapters)).toEqual(expect.any(Array))
    expect(chapters.length).toBeGreaterThan(1)
  })
  // test("Reader", async () => {
  //   const data = await source.getChapterData("bunking-bed-raw", "chapter-93")
  //   expect(ChapterDataSchema.parse(data)).toEqual(expect.any(Object))
  // })
})
