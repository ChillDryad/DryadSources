import { Target } from "../runners/MangaPark"
import emulate from "@suwatte/emulator"
import {
  PagedResultSchema,
  ContentSchema,
  ChapterSchema,
  ChapterDataSchema,
} from "@suwatte/validate"

describe("MangaPark Tests", () => {
  const source = emulate(Target)
  test("Directory", async () => {
    const data = await source.getDirectory({
      page: 1,
    })
    expect(PagedResultSchema.parse(data)).toEqual(expect.any(Object))
    expect(data.results.length).toBeGreaterThanOrEqual(29)
  })
  test("Content", async () => {
    const data = await source.getContent("74763")
    console.log(data)
    expect(ContentSchema.parse(data)).toEqual(expect.any(Object))
    expect(data.title).toBe("Chainsaw Man")
  })
  test("Chapters", async () => {
    const data = await source.getChapters("50280")
    expect(ChapterSchema.array().parse(data)).toEqual(expect.any(Array))
    expect(data.length).toBe(124)
  })
  test("Pages", async () => {
    const data = await source.getChapterData(null, "7445683")
    console.log(data)
    expect(ChapterDataSchema.parse(data)).toEqual(expect.any(Object))
  })
})
