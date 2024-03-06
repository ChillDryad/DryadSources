import { Target } from "../runners/OmegaScans"
import emulate from "@suwatte/emulator"
import {
  PagedResultSchema,
  ContentSchema,
  ChapterSchema,
  ChapterDataSchema,
} from "@suwatte/validate"

describe("OmegaScans tests", () => {
  const source = emulate(Target)

  test("Query", async () => {
    const data = await source.getDirectory({
      page: 1,
      query: "app",
    })
    expect(PagedResultSchema.parse(data)).toEqual(expect.any(Object))
    expect(data.results.length).toBeGreaterThan(1)
  })
  test("Content", async () => {
    const content = await source.getContent("desire-realization-app")
    expect(ContentSchema.parse(content)).toEqual(expect.any(Object))
    expect(content.title).toBe("Desire Realization App")
  })
  test("Chapters", async () => {
    const chapters = await source.getChapters("desire-realization-app")
    expect(ChapterSchema.array().parse(chapters)).toEqual(expect.any(Array))
    expect(chapters.length).toBeGreaterThan(1)
  })
  test("Reader", async () => {
    const data = await source.getChapterData(
      "desire-realization-app",
      "chapter-1",
    )
    expect(ChapterDataSchema.parse(data)).toEqual(expect.any(Object))
  })
})
