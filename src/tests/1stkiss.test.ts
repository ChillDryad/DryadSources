import { Target } from "../runners/1stkissmanga"
import emulate from "@suwatte/emulator"
import {
  PagedResultSchema,
  ContentSchema,
  ChapterSchema,
  ChapterDataSchema,
} from "@suwatte/validate"

describe("1stKissManhua tests", () => {
  const source = emulate(Target)

  test("Directory", async () => {
    const data = await source.getDirectory({
      page: 1,
    })
    expect(PagedResultSchema.parse(data)).toEqual(expect.any(Object))
    expect(data.results.length).toBe(20)
  })
  test("Directory pg 2", async () => {
    const data = await source.getDirectory({
      page: 2,
    })
    expect(PagedResultSchema.parse(data)).toEqual(expect.any(Object))
    expect(data.results.length).toBe(20)
  })
  test("Query", async () => {
    const data = await source.getDirectory({
      page: 1,
      query:
        "Regarding That We Decided to Live in the Countryside With The Female Knight Who Came to Us",
    })
    expect(PagedResultSchema.parse(data)).toEqual(expect.any(Object))
    expect(data.results.length).toBe(1)
  })
  // test("Chapters", async () => {
  //   const chapters = await source.getChapters(
  //     "death-is-the-only-ending-for-the-villainess-2",
  //   )
  //   expect(ChapterSchema.array().parse(chapters)).toEqual(expect.any(Array))
  //   expect(chapters.length).toBeGreaterThan(150)
  // })

  test("Content", async () => {
    const content = await source.getContent("try-begging")
    expect(ContentSchema.parse(content)).toEqual(expect.any(Object))
    expect(content.title).toBe("Try Begging")
  })

  // test("Reader", async () => {
  //   const data = await source.getChapterData(
  //     "try-begging",
  //     "chapter-16",
  //   )
  //   expect(ChapterDataSchema.parse(data)).toEqual(expect.any(Object))
  // })
})
