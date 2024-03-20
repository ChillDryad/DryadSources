export type HeanChapter = {
  id: number
  chapter_name: string
  chapter_title: string | null | undefined
  chapter_thumbnail: string
  chapter_slug: string
  price: number
  created_at: string
  series: {
    id: number
  }
}
export type HeanSeries = {
  id: number
  title: string
  description: string
  author: string
  studio: string
  release_year: string
  alternative_names: string
  adult: boolean
  series_type: string
  series_slug: string
  visibility: string
  thumbnail: string
  background: string
  total_views: number
  status: string
  created_at: string
  updated_at: string
  badge: string
  banner: string
  latest: string
  protagonist: string
}
