import type { Option, Tag } from "@suwatte/daisuke"

export const BASE_URL = "https://toonily.com"

export const GENRES: Tag[] = [
  { id: "action", title: "action", nsfw: false },
  { id: "adventure", title: "adventure", nsfw: false },
  { id: "comedy", title: "comedy", nsfw: false },
  { id: "crime", title: "crime", nsfw: false },
  { id: "drama", title: "drama", nsfw: false },
  { id: "fantasy", title: "fantasy", nsfw: false },
  { id: "gossip", title: "gossip", nsfw: false },
  { id: "historical", title: "historical", nsfw: false },
  { id: "horror", title: "horror", nsfw: false },
  { id: "josei", title: "josei", nsfw: false },
  { id: "magic", title: "magic", nsfw: false },
  { id: "mature", title: "mature", nsfw: true },
  { id: "mystery", title: "mystery", nsfw: false },
  { id: "psychological", title: "psychological", nsfw: false },
  { id: "romance", title: "romance", nsfw: false },
  { id: "school-life", title: "school life", nsfw: false },
  { id: "sci-fi", title: "sci-fi", nsfw: false },
  { id: "seinen", title: "seinen", nsfw: false },
  { id: "shoujo", title: "shoujo", nsfw: false },
  { id: "shounen", title: "shounen", nsfw: false },
  { id: "slice-of-life", title: "slice of life", nsfw: false },
  { id: "sports", title: "sports", nsfw: false },
  { id: "supernatural", title: "supernatural", nsfw: false },
  { id: "thriller", title: "thriller", nsfw: false },
  { id: "tragedy", title: "tragedy", nsfw: false },
  { id: "yaoi", title: "yaoi", nsfw: false },
  { id: "yuri", title: "yuri", nsfw: false },
]

export const ADULT_TAGS: Tag[] = [
  { id: "", title: "Show All", nsfw: true },
  { id: "1", title: "Only Adult Content", nsfw: true },
  { id: "0", title: "Hide Adult Content", nsfw: true },
]

export const STATUS_TAGS: Tag[] = [
  { id: "completed", title: "completed", nsfw: false },
  { id: "on-going", title: "ongoing", nsfw: false },
  { id: "canceled", title: "canceled", nsfw: false },
  { id: "hiatus", title: "hiatus", nsfw: false },
]

export const SORT: Option[] = [
  { title: "relevance", id: "relevance" },
  { title: "latest", id: "latest" },
  { title: "alphabet", id: "alphabet" },
  { title: "rating", id: "rating" },
  { title: "trending", id: "trending" },
  { title: "views", id: "most views" },
  { title: "new", id: "new" },
]
