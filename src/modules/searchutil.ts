import {toInteger} from "lodash"
import {
  Collection,
  Parts,
  QueryParams,
  Search,
  SortOrder,
} from "../constants/Search"
import {ConvertedTags, convertTags} from "../lib/models/Tag"
import getUrl from "./getUrl"
import {SearchState} from "./searchSlice"

const idRegex = /^[0-9]+$/
export const isId = (query: string) => idRegex.test(query)

const COLLECTION_PARAMS = {
  [Collection.ALL]: "",
  [Collection.CLASSIC]: "classic",
  [Collection.EASY]: "easytags",
}

export const SORTBY_PARAMS = {
  [SortOrder.alpha]: "Title",
  [SortOrder.downloads]: "Downloaded",
  [SortOrder.newest]: "Posted",
}

export const PARTS_PARAMS = {
  [Parts.four]: 4,
  [Parts.five]: 5,
  [Parts.six]: 6,
}

export function getQueryParams(state: SearchState, start: number): QueryParams {
  const trimQuery = state.query.trim()
  const cleanQuery = trimQuery.replace(/[^a-zA-Z0-9]/g, " ").trim()
  if (isId(cleanQuery)) {
    // treat numeric query as request for tag by id (rip 1776 tag)
    return {id: toInteger(cleanQuery)}
  }
  const params: QueryParams = {
    Collection: COLLECTION_PARAMS[state.filters.collection],
    Sortby: SORTBY_PARAMS[state.sortOrder],
    n: Search.TAGS_PER_QUERY,
    start: start,
    q: cleanQuery,
  }
  if (state.filters.sheetMusic) {
    params.SheetMusic = "Yes"
  }
  if (state.filters.learningTracks) {
    params.Learning = "Yes"
  }
  if (state.filters.parts && state.filters.parts !== Parts.any) {
    params.Parts = PARTS_PARAMS[state.filters.parts]
  }
  return params
}

export async function fetchAndConvertTags(
  queryParams: QueryParams,
  baseUrl: string = Search.API_BASE,
): Promise<ConvertedTags> {
  const responseText = await getUrl(baseUrl, queryParams)
  return convertTags(responseText)
}
