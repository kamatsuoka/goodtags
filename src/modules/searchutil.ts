import {getDbConnection} from "@app/modules/sqlUtil"
import {toInteger} from "lodash"
import {
  Collection,
  Parts,
  Search,
  SearchParams,
  SortOrder,
} from "../constants/Search"
import {
  ConvertedTags,
  tagsFromApiResponse,
  tagsFromDbRows,
} from "../lib/models/Tag"
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
  [SortOrder.id]: "id",
}

export const PARTS_PARAMS = {
  [Parts.any]: undefined,
  [Parts.four]: 4,
  [Parts.five]: 5,
  [Parts.six]: 6,
}

export function getSearchParams(
  state: SearchState,
  start: number,
): SearchParams {
  const trimQuery = state.query.trim()
  const cleanQuery = trimQuery.replace(/[^a-zA-Z0-9]/g, " ").trim()
  if (isId(cleanQuery)) {
    // treat numeric query as request for tag by id (rip 1776 tag)
    return {id: toInteger(cleanQuery)}
  }

  return {
    collection: state.filters.collection,
    sortBy: state.sortOrder,
    limit: Search.TAGS_PER_QUERY,
    offset: start,
    query: cleanQuery,
    requireSheetMusic: state.filters.sheetMusic,
    requireLearningTracks: state.filters.learningTracks,
    parts: PARTS_PARAMS[state.filters.parts],
  }
}

export async function fetchAndConvertTags(
  searchParams: SearchParams,
  useApi: boolean,
  baseUrl: string = Search.API_BASE,
): Promise<ConvertedTags> {
  if (useApi) {
    const queryParams = buildApiQueryParams(searchParams)
    const responseText = await getUrl(baseUrl, {params: queryParams})
    return tagsFromApiResponse(responseText)
  } else {
    return searchDb(searchParams)
  }
}

export type ApiQueryParams = {
  q?: string
  start?: number
  id?: number
  n?: number
  Collection?: string
  Sortby?: string
  SheetMusic?: string
  Learning?: string
  Parts?: number
}

/** This is *kinda* like Kotlin's `.apply`/`.let`, useful for transforming maybe null values in arbitrary ways */
function apply<T, R>(
  value: T | undefined,
  transformer: (value: T) => R,
): R | undefined {
  return value === undefined ? undefined : transformer(value)
}

function buildApiQueryParams(searchParams: SearchParams): ApiQueryParams {
  return {
    q: searchParams.query,
    // API uses 1-based indexing
    start: apply(searchParams.offset, offset => offset + 1),
    id: searchParams.id,
    n: searchParams.limit,
    Collection: apply(
      searchParams.collection,
      collection => COLLECTION_PARAMS[collection],
    ),
    Sortby: apply(searchParams.sortBy, sortBy => SORTBY_PARAMS[sortBy]),
    SheetMusic: searchParams.requireSheetMusic ? "Yes" : undefined,
    Learning: searchParams.requireLearningTracks ? "Yes" : undefined,
    Parts: searchParams.parts,
  }
}

export type DbRow = {[column: string]: any}

const DEBUG_DB_PERF = false
function debugDbPerfCurrentTime() {
  if (DEBUG_DB_PERF) {
    return global.performance.now()
  } else {
    return 0
  }
}
function debugDbPerfLogging(label: string, start: number) {
  if (DEBUG_DB_PERF) {
    console.debug(label, debugDbPerfCurrentTime() - start)
  }
}

async function searchDb(searchParams: SearchParams): Promise<ConvertedTags> {
  const overallStart = debugDbPerfCurrentTime()
  const {whereVariables, whereClause, suffixClauses, suffixVariables} =
    buildSqlParts(searchParams)
  console.log("whereVariables", whereVariables)
  console.log("whereClause", whereClause)
  console.log("suffixClauses", suffixClauses)
  console.log("suffixVariables", suffixVariables)
  const db = await getDbConnection()
  debugDbPerfLogging("Got db", overallStart)

  // This is kinda a gross API. We can't return anything out of the transaction (and it's generally recommended to use
  // a transaction), so we have to declare these variables here and mutate them within the transaction function >.>
  let tagRows: DbRow[] = []
  let trackRows: DbRow[] = []
  let videoRows: DbRow[] = []
  let count = "0"

  await db.runTransactionAsync(async txn => {
    const start = debugDbPerfCurrentTime()
    debugDbPerfLogging("Txn start", overallStart)
    tagRows = (
      await txn.executeSqlAsync(
        `SELECT * FROM tags${whereClause}${suffixClauses}`,
        [...whereVariables, ...suffixVariables],
      )
    ).rows
    const tagTime = debugDbPerfCurrentTime()

    trackRows = (
      await txn.executeSqlAsync(
        `SELECT * FROM tracks WHERE tracks.tag_id IN (SELECT id FROM tags${whereClause}${suffixClauses})`,
        [...whereVariables, ...suffixVariables],
      )
    ).rows
    const trackTime = debugDbPerfCurrentTime()

    videoRows = (
      await txn.executeSqlAsync(
        `SELECT * FROM videos WHERE videos.tag_id IN (SELECT id FROM tags${whereClause}${suffixClauses})`,
        [...whereVariables, ...suffixVariables],
      )
    ).rows
    const videoTime = debugDbPerfCurrentTime()

    const count_raw = await txn.executeSqlAsync(
      `SELECT COUNT(*) AS count FROM tags${whereClause}`,
      whereVariables,
    )
    const countTime = debugDbPerfCurrentTime()
    if (DEBUG_DB_PERF) {
      console.debug(
        `Per-execution times:\n` +
          `tags=${tagTime - start}\n` +
          `tracks=${trackTime - tagTime}\n` +
          `videos=${videoTime - trackTime}\n` +
          `count=${countTime - videoTime}\n` +
          `total=${countTime - start}`,
      )
    }
    count = count_raw.rows[0].count
  }, true /* readOnly txn */)

  debugDbPerfLogging("Db done, parsing rows", overallStart)
  return tagsFromDbRows(
    tagRows,
    trackRows,
    videoRows,
    count,
    searchParams.offset || 0,
  )
}

/**
 * Given search params, constructs the where clauses+variables (" WHERE ...") and the suffix
 * clauses+variables (order, limit, offset).
 */
function buildSqlParts(searchParams: SearchParams) {
  const whereClauseParts = []
  const whereVariables = []

  if (searchParams.id !== undefined) {
    whereClauseParts.push("tags.id = ?")
    whereVariables.push(searchParams.id)
  }
  if (searchParams.query !== undefined && searchParams.query !== "") {
    whereClauseParts.push(
      "(tags.id IN (SELECT rowid FROM tags_fts WHERE tags_fts MATCH ?) OR tags.title LIKE ?)",
    )
    whereVariables.push(`${searchParams.query}*`)
    whereVariables.push(`%${searchParams.query}%`)
  }
  if (searchParams.parts !== undefined) {
    whereClauseParts.push("tags.parts = ?")
    whereVariables.push(searchParams.parts)
  }
  if (
    searchParams.collection !== undefined &&
    searchParams.collection !== Collection.ALL
  ) {
    whereClauseParts.push("tags.collection = ?")
    whereVariables.push(COLLECTION_PARAMS[searchParams.collection])
  }
  if (searchParams.requireLearningTracks) {
    whereClauseParts.push("tags.id IN (SELECT tag_id FROM tracks)")
  }
  if (searchParams.requireSheetMusic) {
    whereClauseParts.push(
      "tags.sheet_music_alt IS NOT NULL AND tags.sheet_music_alt != ''",
    )
  }
  const whereClause =
    whereClauseParts.length === 0
      ? ""
      : ` WHERE ${whereClauseParts.join(" AND ")}`

  let suffixClauses = ""
  const suffixVariables = []

  switch (searchParams.sortBy) {
    case SortOrder.alpha:
      suffixClauses += " ORDER BY tags.title ASC"
      break
    case SortOrder.downloads:
      suffixClauses += " ORDER BY tags.downloaded DESC"
      break
    case SortOrder.newest:
      suffixClauses += " ORDER BY tags.posted DESC"
      break
  }
  if (searchParams.limit !== undefined) {
    suffixClauses += " LIMIT ?"
    suffixVariables.push(searchParams.limit)
  }
  if (searchParams.offset !== undefined) {
    suffixClauses += " OFFSET ?"
    suffixVariables.push(searchParams.offset)
  }
  return {whereClause, whereVariables, suffixClauses, suffixVariables}
}
