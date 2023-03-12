import {QueryParams} from "../constants/Search"
import {popularXml} from "./__mocks__/popular.xml"
import {PopularQueryParams} from "@app/modules/popularSlice"

/**
 * Mock for detox end-to-end testing
 */
export default async function getUrl(
  baseUrl: string,
  queryParams: QueryParams,
): Promise<string> {
  console.debug(
    `getUrl.e2e: baseUrl=${baseUrl}, queryParams = ${JSON.stringify(
      queryParams,
    )}`,
  )
  if (queryParams === PopularQueryParams) {
    return popularXml
  }
  // TODO: support search
  return (
    '<?xml version="1.0" encoding="iso-8859-1" ?>' +
    '<tags available="5180" count="0" stamp="2022-12-31 19:20:54"></tags>'
  )
}
