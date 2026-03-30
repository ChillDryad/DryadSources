export type ComixPagination = {
  current_page: number
  last_page: number
}

export type ComixPoster = {
  small: string
  medium: string
  large: string
}

export type ComixTerm = {
  term_id: number
  type: string
  title: string
  slug: string
}

export type ComixManga = {
  hash_id: string
  title: string
  alt_titles: string[]
  synopsis: string | null
  type: string
  poster: ComixPoster
  status: string
  is_nsfw: boolean
  rated_avg: number
  author: ComixTerm[] | null
  artist: ComixTerm[] | null
  genre: ComixTerm[] | null
  theme: ComixTerm[] | null
  demographic: ComixTerm[] | null
}

export type ComixScanlationGroup = {
  name: string
}

export type ComixChapter = {
  chapter_id: number
  number: number
  name: string
  updated_at: number
  scanlation_group: ComixScanlationGroup | null
  is_official: number
  scanlation_group_id: number
  votes: number
}

export type SingleMangaResponse = {
  result: ComixManga
}

export type SearchResponse = {
  result: {
    items: ComixManga[]
    pagination: ComixPagination
  }
}

export type ChapterListResponse = {
  result: {
    items: ComixChapter[]
    pagination: ComixPagination
  }
}

export type ChapterImagesResponse = {
  result: {
    chapter_id: number
    images: { url: string }[]
  }
}
