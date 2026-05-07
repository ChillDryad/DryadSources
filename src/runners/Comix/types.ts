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
  hid: string
  title: string
  alt_titles: string[]
  synopsis: string | null
  type: string
  poster: ComixPoster | null
  status: string
  content_rating: string
  rated_avg: number
  author: ComixTerm[] | null
  artist: ComixTerm[] | null
  genre: ComixTerm[] | null
  theme: ComixTerm[] | null
  demographic: ComixTerm[] | null
}

export type ComixScanlationGroup = {
  id?: number
  name: string
}

export type ComixChapter = {
  id: number
  number: number
  name: string
  created_at_formatted: string
  votes: number
  group: ComixScanlationGroup | null
  is_official: boolean
}

export type SingleMangaResponse = {
  result: ComixManga
}

export type ComixMeta = {
  page: number
  lastPage: number
  hasNext: boolean
}

export type SearchResponse = {
  result: {
    items: ComixManga[]
    meta?: ComixMeta
    pagination?: ComixPagination
  }
}

export type ChapterListResponse = {
  result: {
    items: ComixChapter[]
    meta?: ComixMeta
    pagination?: ComixPagination
  }
}

export type ChapterImagesResponse = {
  result: {
    id: number
    pages: { url: string }[]
  }
}
