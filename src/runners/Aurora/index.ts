import {
  CatalogRating,
  type Chapter,
  type ChapterData,
  type Content,
  type ContentSource,
  type DirectoryConfig,
  type DirectoryRequest,
  type PagedResult,
  type RunnerInfo,
  ReadingMode,
} from "@suwatte/daisuke"
import { load } from "cheerio"

const AURORA_DESCRIPTION = `
Aurora is a fantasy webcomic (updates M/W/F) written and illustrated by Red, better known for her work on the YouTube channel "Overly Sarcastic Productions." It's been in the works for over a decade, and she's finally decided to stop putting it off.

If you'd like to discuss the comic, it now has a subreddit, as well as a dedicated twitter and a tumblr where you can ask questions. There's also a dedicated room on the channel discord for conversations about it!

Find Red's general ramblings on Twitter, alongside her cohost Blue, at OSPYouTube.
`.trim()

export class Target implements ContentSource {
  baseUrl = "https://comicaurora.com"
  authorName = "OSP-Red"
  auroraGenre = "fantasy"

  info: RunnerInfo = {
    id: "kusa.aurora",
    name: "Aurora",
    thumbnail: "aurora.png",
    version: 1.0,
    website: this.baseUrl,
    supportedLanguages: ["EN_US"],
    rating: CatalogRating.SAFE,
  }
  client = new NetworkClient()

  async getDirectory(_request: DirectoryRequest): Promise<PagedResult> {
    // Aurora treats chapters as separate manga entries
    const response = await this.client.get(`${this.baseUrl}/archive/`)
    const $ = load(response.data)

    const chapterBlocks = $(".wp-block-image:has(a)").toArray()
    const highlights = chapterBlocks.map((chapter, chapterIndex) => {
      const link = $(chapter).find("a").first()
      const href = link.attr("href") || ""
      const id = href.replace(`${this.baseUrl}/`, "")
      const title = `Aurora - ${link.text().trim()}`
      const cover = $(chapter).find("img").attr("src") || ""
      return { id, title, cover }
    })

    return {
      results: highlights,
      isLastPage: true,
    }
  }

  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.get(`${this.baseUrl}/${contentId}`)
    const $ = load(response.data)

    const title = $(".post-title a, .post-title").first().text().trim()
    const cover = $(".post-thumbnail img, img").first().attr("src") || ""

    // Determine status - the latest chapter is "ongoing", others are completed
    const archiveResponse = await this.client.get(`${this.baseUrl}/archive/`)
    const archiveDoc = load(archiveResponse.data)
    const chapterBlocks = archiveDoc(".wp-block-image:has(a)").toArray()
    const isLatest = chapterBlocks.length > 0 &&
      $(chapterBlocks[chapterBlocks.length - 1]).find("a").attr("href")?.includes(contentId)
    const status = isLatest ? 0 : 1 // 0 = ongoing, 1 = completed

    const chapters = await this.getChapters(contentId)

    return {
      title: title || `Aurora - ${contentId}`,
      cover,
      summary: AURORA_DESCRIPTION,
      creators: [this.authorName],
      status,
      isNSFW: false,
      chapters,
      recommendedPanelMode: ReadingMode.PAGED_COMIC,
      webUrl: `${this.baseUrl}/${contentId}`,
    }
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    // For Aurora, each "manga" (chapter) has multiple pages, each treated as a sub-chapter
    const chapters: Chapter[] = []
    let currentUrl: string | null = `${this.baseUrl}/${contentId}`

    while (currentUrl) {
      const response = await this.client.get(currentUrl)
      const $ = load(response.data)

      const postContents = $(".post-content").toArray()
      for (let i = 0; i < postContents.length; i++) {
        const el = postContents[i]
        const chapterUrl = $(el).find("a.webcomic-link").attr("href") || ""
        const postTitle = $(el).find(".post-title a").text().trim()
        const dateText = $(el).find(".post-date").text().trim()

        // Parse chapter number from title (format: "arc.chapter.page")
        const parts = postTitle.split(".")
        const chapterNr = parts.length > 1 ? parseFloat(parts[1]) : 0

        chapters.push({
          chapterId: chapterUrl.replace(`${this.baseUrl}/`, ""),
          title: postTitle,
          number: chapterNr,
          index: chapters.length,
          language: "EN_US",
          date: dateText ? new Date(dateText) : new Date(0),
        })
      }

      // Check for next page
      const nextPageUrl = $(".paginav-next a").attr("href")
      currentUrl = nextPageUrl || null
    }

    return chapters.reverse()
  }

  async getChapterData(
    _contentId: string,
    chapterId: string,
  ): Promise<ChapterData> {
    const response = await this.client.get(`${this.baseUrl}/${chapterId}`)
    const $ = load(response.data)

    const imageUrl = $(".webcomic-media .webcomic-link .attachment-full").attr("src") || ""

    return {
      pages: [{ url: imageUrl }],
    }
  }

  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {}
  }
}