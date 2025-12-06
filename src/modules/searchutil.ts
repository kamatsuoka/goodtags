import {
  Collection,
  Parts,
  Search,
  SearchParams,
  SortOrder,
} from '@app/constants/Search'
import {
  ConvertedTags,
  tagsFromApiResponse,
  tagsFromDbRows,
} from '@app/lib/models/Tag'
import { getDbConnection } from '@app/modules/sqlUtil'
import { toInteger } from 'lodash'
import getUrl from './getUrl'
import { SearchState } from './searchSlice'

const idRegex = /^[0-9]+$/
export const isId = (query: string) => idRegex.test(query)

const COLLECTION_PARAMS = {
  [Collection.ALL]: '',
  [Collection.CLASSIC]: 'classic',
  [Collection.EASY]: 'easytags',
}

export const SORTBY_PARAMS = {
  [SortOrder.alpha]: 'Title',
  [SortOrder.downloads]: 'Downloaded',
  [SortOrder.newest]: 'Posted',
  [SortOrder.id]: 'id',
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
  const cleanQuery = trimQuery.replace(/[^a-zA-Z0-9]/g, ' ').trim()

  return {
    id: isId(cleanQuery) ? toInteger(cleanQuery) : undefined,
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
  useTransaction: boolean = true,
): Promise<ConvertedTags> {
  if (useApi) {
    const queryParams = buildApiQueryParams(searchParams)
    const responseText = await getUrl(baseUrl, { params: queryParams })
    return tagsFromApiResponse(responseText)
  } else {
    return searchDb(searchParams, useTransaction)
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

export function buildApiQueryParams(
  searchParams: SearchParams,
): ApiQueryParams {
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
    SheetMusic: searchParams.requireSheetMusic ? 'Yes' : undefined,
    Learning: searchParams.requireLearningTracks ? 'Yes' : undefined,
    Parts: searchParams.parts,
  }
}

export type DbRow = { [column: string]: any }

const DEBUG_DB_PERF = false
function debugDbPerfCurrentTime() {
  if (DEBUG_DB_PERF) {
    return (global as any).performance.now()
  } else {
    return 0
  }
}
function debugDbPerfLogging(label: string, start: number) {
  if (DEBUG_DB_PERF) {
    console.debug(label, debugDbPerfCurrentTime() - start)
  }
}

/**
 * Counts the number of tags in the database
 *
 * @returns number of tags in the db
 */
export async function countTags(): Promise<number> {
  const db = await getDbConnection()
  const countRaw = await db.getAllAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM tags`,
  )
  return countRaw[0].count
}

async function searchDb(
  searchParams: SearchParams,
  useTransaction: boolean = true,
): Promise<ConvertedTags> {
  const overallStart = debugDbPerfCurrentTime()
  const { whereVariables, whereClause, suffixClauses, suffixVariables } =
    buildSqlParts(searchParams)
  const db = await getDbConnection()
  debugDbPerfLogging('Got db', overallStart)

  // This is kinda a gross API. We can't return anything out of the transaction (and it's generally recommended to use
  // a transaction), so we have to declare these variables here and mutate them within the transaction function >.>
  let tagRows: DbRow[] = []
  let trackRows: DbRow[] = []
  let videoRows: DbRow[] = []
  let totalCount = 0

  const executeQueries = async () => {
    const start = debugDbPerfCurrentTime()
    debugDbPerfLogging('Txn start', overallStart)
    const tagSql = `SELECT * FROM tags${whereClause}${suffixClauses}`
    console.debug(tagSql, whereVariables, suffixVariables)
    tagRows = await db.getAllAsync<DbRow>(
      tagSql,
      ...whereVariables,
      ...suffixVariables,
    )
    const tagTime = debugDbPerfCurrentTime()

    trackRows = await db.getAllAsync<DbRow>(
      `SELECT * FROM tracks WHERE tracks.tag_id IN (SELECT id FROM tags${whereClause}${suffixClauses})`,
      ...whereVariables,
      ...suffixVariables,
    )
    const trackTime = debugDbPerfCurrentTime()

    videoRows = await db.getAllAsync<DbRow>(
      `SELECT * FROM videos WHERE videos.tag_id IN (SELECT id FROM tags${whereClause}${suffixClauses})`,
      ...whereVariables,
      ...suffixVariables,
    )
    const videoTime = debugDbPerfCurrentTime()

    const totalCountRaw = await db.getAllAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM tags${whereClause}`,
      ...whereVariables,
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
    totalCount = totalCountRaw[0].count

    if (tagRows.length > 1 && totalCount > 1) {
      const msg =
        `got ${tagRows.length}/${totalCount} tags` +
        (searchParams.offset ? ` (offset ${searchParams.offset})` : '')
      console.debug(msg)
    }
  }

  if (useTransaction) {
    await db.runTransactionAsync(executeQueries)
  } else {
    await executeQueries()
  }

  debugDbPerfLogging('Db done, parsing rows', overallStart)
  return tagsFromDbRows(
    tagRows,
    trackRows,
    videoRows,
    totalCount,
    searchParams.offset || 0,
  )
}

/**
 * Builds the where clause.
 *
 * If the query looks like an id, isIdSearch will be true.
 * We will search EITHER for that id, OR for tags with other conditions,
 * including the id-like query as a text search.
 *
 * Assumes that the id condition is the first element of whereClauseParts.
 *
 * @param isIdSearch is searchParams.id defined?
 * @param whereClauseParts parts of where clause, must have id condition first if applicable
 * @returns complete where clause
 */
export function buildWhereClause(
  isIdSearch: boolean,
  whereClauseParts: string[],
) {
  if (whereClauseParts.length === 0) {
    return ''
  }
  if (isIdSearch) {
    const idQuery = ` WHERE ${whereClauseParts[0]}`
    if (whereClauseParts.length === 1) {
      return idQuery // simple id lookup
    } else {
      // id OR the AND of remaining conditions
      const remainingParts = whereClauseParts.slice(1)
      return `${idQuery} OR (${remainingParts.join(' AND ')})`
    }
  }
  return ` WHERE ${whereClauseParts.join(' AND ')}`
}

/**
 * Given search params, constructs the where clauses+variables (" WHERE ...") and the suffix
 * clauses+variables (order, limit, offset).
 */
export function buildSqlParts(searchParams: SearchParams) {
  const whereClauseParts = []
  const whereVariables = []

  const isIdSearch = searchParams.id !== undefined
  if (isIdSearch) {
    // NOTE: whereClauseParts for id must be first
    whereClauseParts.push('tags.id = ?')
    whereVariables.push(searchParams.id)
  }
  if (searchParams.ids !== undefined) {
    whereClauseParts.push(`tags.id in (${searchParams.ids.toString()})`)
  }
  if (searchParams.query !== undefined && searchParams.query !== '') {
    if (isIdSearch) {
      // when searching by id, only match query in title
      whereClauseParts.push('tags.title LIKE ?')
      whereVariables.push(`%${searchParams.query}%`)
    } else {
      // normal text search uses fts and partial matching
      whereClauseParts.push(
        '(tags.id IN (SELECT rowid FROM tags_fts WHERE tags_fts MATCH ?) OR tags.title LIKE ?)',
      )
      whereVariables.push(`${searchParams.query}*`)
      whereVariables.push(`%${searchParams.query}%`)
    }
  }
  if (searchParams.parts !== undefined) {
    whereClauseParts.push('tags.parts = ?')
    whereVariables.push(searchParams.parts)
  }
  if (
    searchParams.collection !== undefined &&
    searchParams.collection !== Collection.ALL
  ) {
    whereClauseParts.push('tags.collection = ?')
    whereVariables.push(COLLECTION_PARAMS[searchParams.collection])
  }
  if (searchParams.requireLearningTracks) {
    whereClauseParts.push('tags.id IN (SELECT tag_id FROM tracks)')
  }
  if (searchParams.requireSheetMusic) {
    whereClauseParts.push(
      "tags.sheet_music_alt IS NOT NULL AND tags.sheet_music_alt != ''",
    )
  }
  const whereClause = buildWhereClause(isIdSearch, whereClauseParts)

  let suffixClauses = ''
  const suffixVariables = []

  switch (searchParams.sortBy) {
    case SortOrder.alpha:
      suffixClauses += ' ORDER BY tags.title ASC'
      break
    case SortOrder.downloads:
      suffixClauses += ' ORDER BY tags.downloaded DESC'
      break
    case SortOrder.newest:
      suffixClauses += ' ORDER BY tags.posted DESC, tags.id DESC'
      break
  }
  if (searchParams.limit !== undefined) {
    suffixClauses += ' LIMIT ?'
    suffixVariables.push(searchParams.limit)
  }
  if (searchParams.offset !== undefined) {
    suffixClauses += ' OFFSET ?'
    suffixVariables.push(searchParams.offset)
  }
  return { whereClause, whereVariables, suffixClauses, suffixVariables }
}
