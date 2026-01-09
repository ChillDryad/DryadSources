export const directory_variables = ({
  page,
  size = 25,
  where = "browse",
  word = "",
  excGenres = [],
  incGenres = [],
  incTLangs = [],
  incOLangs = [],
  sort = "views_d000",
  chapCount = "",
}: {
  page: number
  size?: number
  where?: string
  word?: string
  excGenres?: string[]
  incGenres?: string[]
  incTLangs?: string[]
  incOLangs?: string[]
  sort?: string
  chapCount?: string
}) => {
  const variables = {
    select: {
      page,
      size,
      where,
      word,
      excGenres,
      incGenres,
      incTLangs,
      incOLangs,
      sort,
      chapCount
    },
  }
  // console.log({variables})
  return variables
}