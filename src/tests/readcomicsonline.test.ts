import emulate from "@suwatte/emulator"

import { Target } from "../runners/ReadComicsOnline"
import {
  PagedResultSchema,
  ContentSchema,
  ChapterSchema,
  ChapterDataSchema,
} from "@suwatte/validate"

describe("ReadComicsOnline.ru tests", () => {
  const source = emulate(Target)

  test("Directory", async () => {
    const data = await source.getDirectory({
      page: 1,
      sort: {
        id: "name",
        ascending: false,
      },
    })
    expect(PagedResultSchema.parse(data)).toEqual(expect.any(Object))
    expect(data.results.length).toBe(60)
  })
  test("Search", async () => {
    const data = await source.getDirectory({
      page: 1,
      query: "Mighty Nein",
    })
    expect(PagedResultSchema.parse(data)).toEqual(expect.any(Object))
    expect(data.results.length).toBeLessThan(20)
  })
  test("Content", async () => {
    const content = await source.getContent(
      "critical-role-the-chronicles-of-exandriathe-mighty-nein-2020",
    )
    expect(ContentSchema.parse(content)).toEqual(expect.any(Object))
    expect(content.title).toBe(
      "Critical Role: The Chronicles of Exandria--The Mighty Nein (2020)",
    )
  })
  test("Chapters", async () => {
    const chapters = await source.getChapters(
      "critical-role-the-chronicles-of-exandriathe-mighty-nein-2020",
    )
    expect(ChapterSchema.array().parse(chapters)).toEqual(expect.any(Array))
    expect(chapters.length).toBe(1)
  })
  test("Reader", async () => {
    const data = await source.getChapterData(
      "critical-role-the-chronicles-of-exandriathe-mighty-nein-2020",
      "1",
    )
    expect(ChapterDataSchema.parse(data)).toEqual(expect.any(Object))
  })
})
