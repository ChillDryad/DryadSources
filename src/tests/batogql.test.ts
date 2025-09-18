import { Target } from "../runners/bato.gql"
import emulate from "@suwatte/emulator"
import {
  PagedResultSchema,
  ContentSchema,
  ChapterSchema,
  ChapterDataSchema,
} from "@suwatte/validate"

describe("Bato Tests", () => {
  const source = emulate(Target)

  test("Query", async () => {
    const data = await source.getDirectory({
      page: 1,
      query: "doctor",
    })
    expect(PagedResultSchema.parse(data)).toEqual(expect.any(Object))
    expect(data.results.length).toBeGreaterThan(1)
  })

  test("Content", async () => {
    const content = await source.getContent("82386")
    expect(ContentSchema.parse(content)).toEqual(expect.any(Object))
  })

  test("Chapters", async () => {
    const chapters = await source.getChapters("83510")
    expect(ChapterSchema.array().parse(chapters)).toEqual(expect.any(Array))
    expect(chapters.length).toBeGreaterThan(1)
  })

  test("Reader", async () => {
    const data = await source.getChapterData("_", "1591864")
    expect(ChapterDataSchema.parse(data)).toEqual(expect.any(Object))
  })
})
