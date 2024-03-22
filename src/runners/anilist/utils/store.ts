import { authenticated, request } from "."
import { CurrentViewerQuery } from "../gql"

export const getNSFWSetting = async () => {
  const isAuthenticated = await authenticated()
  if (!isAuthenticated) return false

  let user
  try {
    const response = await request<any>(CurrentViewerQuery)
    user = response.data.Viewer
  } catch {
    return false
  }

  if (!user) return false

  return user.options.displayAdultContent
}
