import emulate from "@suwatte/emulator"
import { Target } from "../runners/toonily"
import {
  ChapterDataSchema,
  ChapterSchema,
  ContentSchema,
  PagedResultSchema,
} from "@suwatte/validate"
describe("Toonily Tests", () => {
  const source = emulate(Target)

  test("Search Landing", async () => {
    const data = await source.getDirectory({
      page: 1,
    })
    expect(PagedResultSchema.parse(data)).toEqual(expect.any(Object))
    expect(data.results.length).toBe(18)
  })
  //https://toonily.com/webtoon/springtime-blossom-003/
  test("Chapters", async () => {
    const chapters = await source.getChapters("springtime-blossom-003")
    expect(ChapterSchema.array().parse(chapters)).toEqual(expect.any(Array))
    expect(chapters.length).toBeGreaterThan(1)
  })
  test("Reader", async () => {
    const data = await source.getChapterData("foo", "springtime-blossom-003/chapter-1/")
    expect(ChapterDataSchema.parse(data)).toEqual(expect.any(Object))
  })
})
