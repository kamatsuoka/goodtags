import { Collection, Parts, SearchParams, SortOrder } from '@app/constants/Search'
import { SearchState } from '../searchSlice'
import {
  buildApiQueryParams,
  buildSqlParts,
  buildWhereClause,
  getSearchParams,
  isId,
} from '../searchutil'
import { LoadingState } from '../tagLists'

// Mock dependencies
jest.mock('@app/modules/sqlUtil')
jest.mock('../getUrl')

describe('searchutil', () => {
  describe('isId', () => {
    it('returns true for numeric strings', () => {
      expect(isId('123')).toBe(true)
      expect(isId('0')).toBe(true)
      expect(isId('999999')).toBe(true)
    })

    it('returns false for non-numeric strings', () => {
      expect(isId('abc')).toBe(false)
      expect(isId('12a')).toBe(false)
      expect(isId('12.3')).toBe(false)
      expect(isId('')).toBe(false)
      expect(isId('12 34')).toBe(false)
    })
  })

  describe('getSearchParams', () => {
    const baseState: SearchState = {
      query: '',
      sortOrder: SortOrder.alpha,
      filters: {
        collection: Collection.ALL,
        sheetMusic: false,
        learningTracks: false,
        parts: Parts.any,
        offline: true,
      },
      error: undefined,
      selectedTag: undefined,
      loadingState: LoadingState.idle,
      firstTimeUser: false,
      results: {
        tagsById: {},
        allTagIds: [],
        moreAvailable: false,
      },
    }

    it('creates search params with basic query', () => {
      const state: SearchState = {
        ...baseState,
        query: 'test query',
      }

      const params = getSearchParams(state, 0)

      expect(params.query).toBe('test query')
      expect(params.id).toBeUndefined()
      expect(params.offset).toBe(0)
    })

    it('cleans query by removing special characters', () => {
      const state: SearchState = {
        ...baseState,
        query: 'test@#$%query!!!',
      }

      const params = getSearchParams(state, 0)

      expect(params.query).toBe('test    query')
    })

    it('sets id when query is numeric', () => {
      const state: SearchState = {
        ...baseState,
        query: '12345',
      }

      const params = getSearchParams(state, 0)

      expect(params.id).toBe(12345)
      expect(params.query).toBe('12345')
    })

    it('includes all filters', () => {
      const state: SearchState = {
        ...baseState,
        query: 'test',
        sortOrder: SortOrder.downloads,
        filters: {
          collection: Collection.CLASSIC,
          sheetMusic: true,
          learningTracks: true,
          parts: Parts.four,
          offline: true,
        },
      }

      const params = getSearchParams(state, 10)

      expect(params.collection).toBe(Collection.CLASSIC)
      expect(params.sortBy).toBe(SortOrder.downloads)
      expect(params.requireSheetMusic).toBe(true)
      expect(params.requireLearningTracks).toBe(true)
      expect(params.parts).toBe(4)
      expect(params.offset).toBe(10)
    })
  })

  describe('buildApiQueryParams', () => {
    it('builds basic query params', () => {
      const searchParams: SearchParams = {
        query: 'test',
        offset: 0,
        limit: 33,
      }

      const result = buildApiQueryParams(searchParams)

      expect(result.q).toBe('test')
      expect(result.start).toBe(1) // API uses 1-based indexing
      expect(result.n).toBe(33)
    })

    it('handles id search', () => {
      const searchParams: SearchParams = {
        id: 12345,
      }

      const result = buildApiQueryParams(searchParams)

      expect(result.id).toBe(12345)
    })

    it('converts collection filter', () => {
      const searchParams: SearchParams = {
        collection: Collection.CLASSIC,
      }

      const result = buildApiQueryParams(searchParams)

      expect(result.Collection).toBe('classic')
    })

    it('converts sort order', () => {
      const searchParams: SearchParams = {
        sortBy: SortOrder.downloads,
      }

      const result = buildApiQueryParams(searchParams)

      expect(result.Sortby).toBe('Downloaded')
    })

    it('handles sheet music and learning tracks filters', () => {
      const searchParams: SearchParams = {
        requireSheetMusic: true,
        requireLearningTracks: true,
      }

      const result = buildApiQueryParams(searchParams)

      expect(result.SheetMusic).toBe('Yes')
      expect(result.Learning).toBe('Yes')
    })

    it('omits false boolean filters', () => {
      const searchParams: SearchParams = {
        requireSheetMusic: false,
        requireLearningTracks: false,
      }

      const result = buildApiQueryParams(searchParams)

      expect(result.SheetMusic).toBeUndefined()
      expect(result.Learning).toBeUndefined()
    })

    it('handles parts filter', () => {
      const searchParams: SearchParams = {
        parts: 4,
      }

      const result = buildApiQueryParams(searchParams)

      expect(result.Parts).toBe(4)
    })
  })

  describe('buildWhereClause', () => {
    it('returns empty string for no conditions', () => {
      const result = buildWhereClause(false, [])
      expect(result).toBe('')
    })

    it('builds simple WHERE clause', () => {
      const result = buildWhereClause(false, ['tags.id = ?'])
      expect(result).toBe(' WHERE tags.id = ?')
    })

    it('builds AND clause for multiple conditions', () => {
      const result = buildWhereClause(false, ['tags.id = ?', 'tags.parts = ?'])
      expect(result).toBe(' WHERE tags.id = ? AND tags.parts = ?')
    })

    it('handles id search with single condition', () => {
      const result = buildWhereClause(true, ['tags.id = ?'])
      expect(result).toBe(' WHERE tags.id = ?')
    })

    it('builds OR clause for id search with multiple conditions', () => {
      const result = buildWhereClause(true, ['tags.id = ?', 'tags.title LIKE ?', 'tags.parts = ?'])
      expect(result).toBe(' WHERE tags.id = ? OR (tags.title LIKE ? AND tags.parts = ?)')
    })

    it('creates proper OR structure with id and other filters', () => {
      const result = buildWhereClause(true, ['tags.id = ?', 'tags.collection = ?'])
      expect(result).toBe(' WHERE tags.id = ? OR (tags.collection = ?)')
    })
  })

  describe('buildSqlParts', () => {
    it('builds empty query for no params', () => {
      const result = buildSqlParts({})

      expect(result.whereClause).toBe('')
      expect(result.whereVariables).toEqual([])
      expect(result.suffixClauses).toBe('')
      expect(result.suffixVariables).toEqual([])
    })

    it('builds WHERE clause for id search', () => {
      const result = buildSqlParts({ id: 123 })

      expect(result.whereClause).toBe(' WHERE tags.id = ?')
      expect(result.whereVariables).toEqual([123])
    })

    it('builds WHERE clause for ids search', () => {
      const result = buildSqlParts({ ids: [1, 2, 3] })

      expect(result.whereClause).toBe(' WHERE tags.id in (1,2,3)')
      expect(result.whereVariables).toEqual([])
    })

    it('builds WHERE clause for text query', () => {
      const result = buildSqlParts({ query: 'test' })

      expect(result.whereClause).toContain('tags_fts MATCH ?')
      expect(result.whereClause).toContain('tags.title LIKE ?')
      expect(result.whereVariables).toEqual(['test*', '%test%'])
    })

    it('builds WHERE clause for parts filter', () => {
      const result = buildSqlParts({ parts: 4 })

      expect(result.whereClause).toBe(' WHERE tags.parts = ?')
      expect(result.whereVariables).toEqual([4])
    })

    it('builds WHERE clause for collection filter', () => {
      const result = buildSqlParts({ collection: Collection.CLASSIC })

      expect(result.whereClause).toBe(' WHERE tags.collection = ?')
      expect(result.whereVariables).toEqual(['classic'])
    })

    it('skips ALL collection', () => {
      const result = buildSqlParts({ collection: Collection.ALL })

      expect(result.whereClause).toBe('')
      expect(result.whereVariables).toEqual([])
    })

    it('builds WHERE clause for learning tracks filter', () => {
      const result = buildSqlParts({ requireLearningTracks: true })

      expect(result.whereClause).toContain('tags.id IN (SELECT tag_id FROM tracks)')
    })

    it('builds WHERE clause for sheet music filter', () => {
      const result = buildSqlParts({ requireSheetMusic: true })

      expect(result.whereClause).toContain('tags.sheet_music_alt IS NOT NULL')
    })

    it('combines multiple WHERE conditions with AND', () => {
      const result = buildSqlParts({
        query: 'test',
        parts: 4,
        collection: Collection.EASY,
      })

      expect(result.whereClause).toContain('AND')
      expect(result.whereVariables).toEqual(['test*', '%test%', 4, 'easytags'])
    })

    it('builds OR structure for id with other conditions', () => {
      const result = buildSqlParts({
        id: 123,
        query: 'test',
      })

      expect(result.whereClause).toContain(' WHERE tags.id = ? OR (')
      expect(result.whereVariables).toEqual([123, '%test%'])
    })

    it('builds ORDER BY for alpha sort', () => {
      const result = buildSqlParts({ sortBy: SortOrder.alpha })

      expect(result.suffixClauses).toBe(' ORDER BY tags.title ASC')
    })

    it('builds ORDER BY for downloads sort', () => {
      const result = buildSqlParts({ sortBy: SortOrder.downloads })

      expect(result.suffixClauses).toBe(' ORDER BY tags.downloaded DESC')
    })

    it('builds ORDER BY for newest sort', () => {
      const result = buildSqlParts({ sortBy: SortOrder.newest })

      expect(result.suffixClauses).toBe(' ORDER BY tags.posted DESC, tags.id DESC')
    })

    it('builds LIMIT clause', () => {
      const result = buildSqlParts({ limit: 33 })

      expect(result.suffixClauses).toBe(' LIMIT ?')
      expect(result.suffixVariables).toEqual([33])
    })

    it('builds OFFSET clause', () => {
      const result = buildSqlParts({ offset: 10 })

      expect(result.suffixClauses).toBe(' OFFSET ?')
      expect(result.suffixVariables).toEqual([10])
    })

    it('builds complete query with all parts', () => {
      const result = buildSqlParts({
        query: 'test',
        collection: Collection.CLASSIC,
        parts: 4,
        requireSheetMusic: true,
        requireLearningTracks: true,
        sortBy: SortOrder.downloads,
        limit: 33,
        offset: 10,
      })

      expect(result.whereClause).toContain('WHERE')
      expect(result.whereVariables.length).toBeGreaterThan(0)
      expect(result.suffixClauses).toContain('ORDER BY')
      expect(result.suffixClauses).toContain('LIMIT')
      expect(result.suffixClauses).toContain('OFFSET')
      expect(result.suffixVariables).toEqual([33, 10])
    })
  })
})
