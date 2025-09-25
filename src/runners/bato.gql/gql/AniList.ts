export const trackerSearch = `
query SimpleSearch ($search: String, $startDate: FuzzyDateInt) {
  Page(perPage: 2) {
    media(
      search: $search,
      type: MANGA,
      startDate_lesser: $startDate
    ) {
      id
      idMal
      title {
        english
      }
    }
  }
}
`
export const trackerVariables = ({
  search, 
  start
}: {
  search: string, 
  start: string
}) => {
  const vars = {
    search: search.replace(/(<|\(|\[)?.?official.?(>|\]|\))?/gi, "").trim(),
    start: `${Number(start) + 1}0000`,
  }
  console.log(vars)
  return vars
}