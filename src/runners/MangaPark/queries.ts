export const SearchQuery = `
query ($select: SearchComic_Select) {
  get_searchComic(select: $select) {
    items {
      data {
        id
        name
        urlCoverOri
        urlPath
      }
    }
  }
}
`

export const ContentQuery = `
query($id: ID!) {
  get_comicNode(id: $id) {
    data {
      id
      name
      altNames
      artists
      authors
      genres
      originalStatus
      uploadStatus
      summary
      urlCoverOri
      urlPath
      sfw_result
    }
  }
}
`

export const ChaptersQuery = `
query($id: ID!) {
  get_comicChapterList(comicId: $id) {
    data {
      id
      dname
      title
      dateModify
      dateCreate
      urlPath
    }
  }
}
`

export const PagesQuery = `
query($id: ID!) {
  get_chapterNode(id: $id) {
    data {
      imageFile {
        urlList
      }
    }
  }
}
`
