export type WeebdexCover = {
  id: string
  ext: string
  volume?: string | null
}

export type WeebdexNamedEntity = {
  name: string
}

export type WeebdexRelationships = {
  authors: WeebdexNamedEntity[]
  artists: WeebdexNamedEntity[]
  tags: WeebdexNamedEntity[]
  cover: WeebdexCover | null
}

export type WeebdexManga = {
  id: string
  title: string
  description: string
  status: string | null
  relationships: WeebdexRelationships | null
}

export type WeebdexMangaList = {
  data: WeebdexManga[]
  page: number
  limit: number
  total: number
}

export type WeebdexPageData = {
  name: string | null
}

export type WeebdexChapterRelationships = {
  groups: WeebdexNamedEntity[]
  manga: WeebdexManga | null
}

export type WeebdexChapter = {
  id: string
  title: string | null
  chapter: string | null
  volume: string | null
  published_at: string
  language: string
  node: string | null
  data: WeebdexPageData[] | null
  data_optimized: WeebdexPageData[] | null
  relationships: WeebdexChapterRelationships | null
}

export type WeebdexChapterList = {
  data: WeebdexChapter[]
  page: number
  limit: number
  total: number
}

export type WeebdexUpdateEntry = {
  relationships: { manga: { id: string } | null } | null
}

export type WeebdexUpdatesList = {
  data: WeebdexUpdateEntry[]
  map: { manga: Record<string, WeebdexManga> } | null
  page: number
  limit: number
  total: number
}
