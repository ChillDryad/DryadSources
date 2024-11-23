import { Target } from "../runners/nhentai"
import emulate from "@suwatte/emulator"
import {
  PagedResultSchema,
  ContentSchema,
  ChapterSchema,
  ChapterDataSchema,
} from "@suwatte/validate"

describe("Nhentai tests", () => {
  const source = emulate(Target)

  test("Query", async () => {
    const data = await source.getDirectory({
      page: 1,
      query: "office",
    })
    expect(PagedResultSchema.parse(data)).toEqual(expect.any(Object))
    expect(data.results.length).toBe(25)
  })
  test("Multi-word Query", async () => {
    const data = await source.getDirectory({
      page: 1,
      query: "office lady",
    })
    expect(PagedResultSchema.parse(data)).toEqual(expect.any(Object))
    expect(data.results.length).toBe(25)
  })
  test("Content", async () => {
    const content = await source.getContent("540078")
    expect(ContentSchema.parse(content)).toEqual(expect.any(Object))
    expect(content.title).toBe(
      "[Nanbou Hitogakushiki (Nakamura Regura)] Kohakushoku no to [English] [SDTLs] [Digital]",
    )
  })
  test("Chapters", async () => {
    const chapters = await source.getChapters("540078")
    expect(ChapterSchema.array().parse(chapters)).toEqual(expect.any(Array))
    expect(chapters.length).toBe(1)
  })
  test("Reader", async () => {
    const data = await source.getChapterData("", "540078")
    expect(ChapterDataSchema.parse(data)).toEqual(expect.any(Object))
  })
})
