import type { NetworkRequest } from "@suwatte/daisuke"
import { BASE_URL } from "./constants"

export const interceptor = async (req: NetworkRequest) => {
  return {
    ...req,
    headers: {
      ...req.headers,
      Referer: `${BASE_URL}/`,
    },
    cookies: [
      ...(req.cookies || []),
      {
        name: "toonily-lazyload",
        value: "off",
      }, {
        name: "toonily-mature",
        value: "1"
      }
    ],
  }
}