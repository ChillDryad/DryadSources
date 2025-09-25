export const directory = `
query get_content_searchComic($select: SearchComic_Select) {
  get_content_searchComic(select: $select) {
    items {
      id
      data {
        id
        name
        genres
        origLang
        tranLang
        uploadStatus
        urlCoverOri
      }
    }
  }
}`
// can pass in "imageFiles" inside of data for all chapters
// this is slow atm though so not recommended.
export const content = `
query ($manga: ID!) {
  get_content_comicNode(id: $manga) {
    data {
      id
      dbStatus
      slug
      urlPath
      name
      altNames
      authors
      artists
      genres
      origLang
      tranLang
      originalPubFrom
      uploadStatus
      urlCover600
      readDirection
      summary {
        text
      }
    }
  }
}`
export const chapter_query = `
query($manga: ID!) {
  get_content_comicNode(id: $manga) {
    data {
      tranLang
    }
  }
  get_content_chapterList(comicId:$manga) {
    data {
      id
      datePublic
      dname
      title
      lang
      urlPath
      volNum
      chaNum
      imageFiles
    }
  }
}
`