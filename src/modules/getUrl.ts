import axios from "axios"
import {QueryParams} from "../constants/Search"

export default async function getUrl(
  baseUrl: string,
  queryParams: QueryParams,
): Promise<string> {
  console.debug(
    `getUrl: baseUrl=${baseUrl}, queryParams = ${JSON.stringify(queryParams)}`,
  )
  const response = await axios.get(baseUrl, {params: queryParams})
  if (response.status !== 200) {
    // TODO: store debugging log
    const msg =
      response.statusText ||
      `${response.status}` ||
      `got undefined status from ${response.request.url} ` +
        `with params ${JSON.stringify(queryParams)}`
    throw Error(msg)
  }
  return response.data
}
