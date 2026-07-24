import { Target } from "../runners/ComicKFan"
import emulate from "@suwatte/emulator"
import {
  PagedResultSchema,
  ContentSchema,
  ChapterSchema,
  ChapterDataSchema,
} from "@suwatte/validate"

describe("ComicKFan tests", () => {
  const source = emulate(Target)

  test("Query", async () => {
    const data = await source.getDirectory({
      page: 1,
    })
    expect(PagedResultSchema.parse(data)).toEqual(expect.any(Object))
    expect(data.results.length).toBeGreaterThan(0)
  })

  test("Content", async () => {
    const data = await source.getDirectory({ page: 1 })
    expect(data.results.length).toBeGreaterThan(0)
    const content = await source.getContent(data.results[0].id)
    expect(ContentSchema.parse(content)).toEqual(expect.any(Object))
    expect(content.title).toBeTruthy()
  })

  test("Chapters", async () => {
    const data = await source.getDirectory({ page: 1 })
    expect(data.results.length).toBeGreaterThan(0)
    const chapters = await source.getChapters(data.results[0].id)
    expect(ChapterSchema.array().parse(chapters)).toEqual(expect.any(Array))
  })

  test("Reader", async () => {
    const data = await source.getDirectory({ page: 1 })
    expect(data.results.length).toBeGreaterThan(0)
    const content = await source.getContent(data.results[0].id)
    expect(content.chapters.length).toBeGreaterThan(0)
    const chapterData = await source.getChapterData(
      data.results[0].id,
      content.chapters[0].chapterId,
    )
    expect(ChapterDataSchema.parse(chapterData)).toEqual(expect.any(Object))
  })
})
