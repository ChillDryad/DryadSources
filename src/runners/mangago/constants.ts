import type { Tag } from "@suwatte/daisuke"

export const SORT = [
  { id: "title", title: "Title" },
  { id: "comment_count", title: "Most Popular" },
  { id: "create_date", title: "Created" },
  { id: "update_date", title: "Updated" },
]

export const ADULT: Tag[] = [
  { id: "Smut", title: "Smut", nsfw: true },
  { id: "Adult", title: "Adult", nsfw: true },
  { id: "Ecchi", title: "Ecchi", nsfw: true },
  // If anyone can confirm if Bara is usually adult or not I'd appreciate it.
  { id: "Bara", title: "Bara", nsfw: true },
  { id: "Mature", title: "Mature", nsfw: true },
]

export const STATUS = [
  { id: "completed", title: "Completed" },
  { id: "ongoing", title: "Ongoing" },
]

export const TAGS: Tag[] = [
  { id: "Yaoi", title: "Yaoi" },
  { id: "Comedy", title: "Comedy" },
  { id: "Shounen Ai", title: "Shounen Ai" },
  { id: "Shoujo", title: "Shoujo" },
  { id: "Yuri", title: "Yuri" },
  { id: "Josei", title: "Josei" },
  { id: "Fantasy", title: "Fantasy" },
  { id: "School Life", title: "School Life" },
  { id: "Romance", title: "Romance" },
  { id: "Doujinshi", title: "Doujinshi" },
  { id: "Mystery", title: "Mystery" },
  { id: "One Shot", title: "One Shot" },
  { id: "Shounen", title: "Shounen" },
  { id: "Martial Arts", title: "Martial Arts" },
  { id: "Shoujo Ai", title: "Shoujo Ai" },
  { id: "Supernatural", title: "Supernatural" },
  { id: "Drama", title: "Drama" },
  { id: "Action", title: "Action" },
  { id: "Adventure", title: "Adventure" },
  { id: "Harem", title: "Harem" },
  { id: "Historical", title: "Historical" },
  { id: "Mecha", title: "Mecha" },
  { id: "Psychological", title: "Psychological" },
  { id: "Sci-fi", title: "Sci-fi" },
  { id: "Seinen", title: "Seinen" },
  { id: "Slice Of Life", title: "Slice Of Life" },
  { id: "Sports", title: "Sports" },
  { id: "Gender Bender", title: "Gender Bender" },
  { id: "Tragedy", title: "Tragedy" },
  { id: "Webtoons", title: "Webtoons" },
  { id: "Horror", title: "Horror" },
]
