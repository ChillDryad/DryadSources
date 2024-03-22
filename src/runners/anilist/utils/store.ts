import { authenticated, request } from "."
import { CurrentViewerQuery } from "../gql"
import { CurrentViewerResponse } from "../types"

export const getNSFWSetting = async () => {
  const isAuthenticated = await authenticated()
  if (!isAuthenticated) return false

  let user
  try {
    const response = await request<CurrentViewerResponse>(CurrentViewerQuery)
    user = response.data.Viewer
  } catch {
    return false
  }

  if (!user) return false

  return user.options.displayAdultContent
}
