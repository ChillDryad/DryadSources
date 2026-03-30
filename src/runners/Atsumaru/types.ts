export type AtsumaruManga = {
  id: string
  title: string
  poster?: unknown
  image?: unknown
  authors?: { name: string }[] | null
  synopsis?: string | null
  tags?: { name: string }[] | null
  status?: string | null
  type?: string | null
  scanlators?: { id: string; name: string }[] | null
}

export type AtsumaraBrowseResponse = {
  items: AtsumaruManga[]
}

export type AtsumaruSearchResponse = {
  page: number
  found: number
  hits: { document: AtsumaruManga }[]
  requestParams: { perPage: number }
}

export type AtsumaruMangaResponse = {
  mangaPage: AtsumaruManga
}

export type AtsumaruChapter = {
  id: string
  number: number
  title: string
  scanlationMangaId?: string | null
  createdAt?: string | number | null
}

export type AtsumaruChapterListResponse = {
  chapters: AtsumaruChapter[]
}

export type AtsumaruPageData = {
  image: string
}

export type AtsumaruPageResponse = {
  readChapter: { pages: AtsumaruPageData[] }
}

export type AtsumaruSearchRequest = {
  page: number
  filter: {
    search?: string
    types: string[]
    status?: string[]
    genres?: string[]
    sortBy?: string
    showAdult: boolean
    officialTranslation: boolean
  }
}
