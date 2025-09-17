export const directory = `
query get_content_searchComic($select: SearchComic_Select) {
  get_content_searchComic(select: $select) {
    reqPage
    reqSize
    reqSort
    reqWord
    newPage
    paging {
      total
      pages
      page
      init
      size
      skip
      limit
    }
    items {
      id
      data {
        id
        name
        dbStatus
        isNormal
        genres
        origLang
        tranLang
        uploadStatus
        originalStatus
        originalPubFrom
        originalPubTill
        urlCover600
        urlCover300
        urlCoverOri
        stat_is_hot
        stat_is_new
        stat_count_emotions {
          field
          count
        }
        stat_count_statuss {
          field
          count
        }
        stat_score_avg
        stat_score_bay
        stat_count_chapters_normal
        stat_count_chapters_others
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
      uploadStatus
      originalStatus
      originalPubFrom
      originalPubTill
      urlCover600
      urlCover300
      urlCoverOri
      stat_score_avg
      stat_score_bay
      stat_count_chapters_normal
      stat_count_chapters_others
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
      dbStatus
      isNormal
      isHidden
      isDeleted
      isFinal
      dateCreate
      datePublic
      dateModify
      dname
      title
      lang
      urlPath
    }
  }
}
`