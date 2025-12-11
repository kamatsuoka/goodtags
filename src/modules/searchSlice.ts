import { Collection, Parts, SortOrder } from '@app/constants/Search'
import { buildTagIds, ConvertedTags, SearchResult, SearchResultsById } from '@app/lib/models/Tag'
import { RootState } from '@app/store'
import { AnyAction, createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { handleError } from './handleError'
import { fetchAndConvertTags, getSearchParams } from './searchutil'
import { LoadingState, TagListState } from './tagLists'
import { SelectedTag } from './tagListUtil'
import { ThunkApiConfig } from './thunkApiConfig'

/**
 * Search params. All are optional: leave unset to keep existing values.
 */
export type SearchParams = {
  query?: string
  filters?: SearchFilters
  sortOrder?: SortOrder
}
export interface SearchFilters {
  learningTracks: boolean
  sheetMusic: boolean
  collection: Collection
  parts: Parts
  offline: boolean
}

interface Results {
  tagsById: SearchResultsById
  allTagIds: number[]
  moreAvailable: boolean
}

// Define a type for the slice state
export interface SearchState {
  error?: string
  query: string
  selectedTag?: SelectedTag
  loadingState: LoadingState
  firstTimeUser: boolean
  filters: SearchFilters
  sortOrder: SortOrder
  results: Results
}

export interface SearchPayload {
  tags: SearchResult[]
  highestIndex: number
  available: number
  queryTagId: number
  type: 'SearchPayload'
}

export function isASearchPayload(obj: any): obj is SearchPayload {
  return 'type' in obj && obj.type === 'SearchPayload'
}

export const InitialFilters: SearchFilters = {
  learningTracks: false,
  sheetMusic: true,
  collection: Collection.ALL,
  parts: Parts.any,
  offline: true,
}

const initialResults: Results = {
  allTagIds: [],
  moreAvailable: false,
  tagsById: {},
}

// Define the initial state using that type
export const initialState: SearchState = {
  query: '',
  loadingState: LoadingState.idle,
  firstTimeUser: true,
  filters: InitialFilters,
  sortOrder: SortOrder.downloads,
  results: initialResults,
  error: '',
}

export const searchSlice = createSlice({
  name: 'search',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload
    },
    setFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.filters = action.payload
    },
    setLoadingState: (state, action: PayloadAction<LoadingState>) => {
      state.loadingState = action.payload
    },
    clearSearch: state => {
      state.results = initialResults
      state.query = ''
      state.error = ''
      state.loadingState = LoadingState.idle
    },
    resetResults: state => {
      state.results = initialResults
    },
    setSelectedTag: (state, action) => {
      state.selectedTag = action.payload
    },
    setSortOrder: (state, action: PayloadAction<SortOrder>) => {
      state.sortOrder = action.payload
    },
  },
  extraReducers: builder => {
    builder
      .addCase(newSearch.fulfilled, (state, action) => {
        const { tagsById, allTagIds } = buildTagIds(action.payload.tags)
        state.results.tagsById = tagsById
        state.results.allTagIds = allTagIds
        state.results.moreAvailable = action.payload.highestIndex < action.payload.available - 1
        state.loadingState = LoadingState.succeeded
        state.selectedTag = undefined
      })
      .addCase(moreSearch.fulfilled, (state, action) => {
        const { tagsById, allTagIds } = buildTagIds(action.payload.tags)
        state.results.tagsById = { ...state.results.tagsById, ...tagsById }
        state.results.allTagIds = state.results.allTagIds.concat(allTagIds)
        state.results.moreAvailable = action.payload.highestIndex < action.payload.available - 1
        state.loadingState = LoadingState.succeeded
      })
      .addCase(newSearch.pending, state => {
        state.loadingState = LoadingState.pending
        state.error = undefined
      })
      .addCase(moreSearch.pending, state => {
        state.loadingState = LoadingState.morePending
        state.error = undefined
      })
      .addMatcher(isSearchAction('/rejected'), (state, action: PayloadAction<string>) => {
        state.loadingState = LoadingState.failed
        state.error = action.payload
      })
  },
})

function isSearchAction(actionType: string) {
  return (action: AnyAction) =>
    action.type.startsWith('search/') && action.type.endsWith(actionType)
}

async function fetchTags(state: SearchState, start: number): Promise<SearchPayload> {
  const useApi = !state.filters.offline
  const searchParams = getSearchParams(state, start)
  const fetchResult: ConvertedTags = await fetchAndConvertTags(searchParams, useApi)
  const available = fetchResult.available
  const tags = fetchResult.tags
  const highestIndex = fetchResult.highestIndex
  return {
    tags,
    highestIndex,
    available,
    queryTagId: searchParams.id || 0,
    type: 'SearchPayload',
  }
}

/**
 * Do a new search, either setting query + filters or setting sort order
 */
export const newSearch = createAsyncThunk<SearchPayload, SearchParams, ThunkApiConfig>(
  'search/newSearch',
  async (params: SearchParams, thunkAPI) => {
    thunkAPI.dispatch(SearchActions.resetResults())
    if (params.sortOrder) {
      // just change sort with existing query and filters
      thunkAPI.dispatch(SearchActions.setSortOrder(params.sortOrder))
    } else {
      // sort with new query and/or filters
      if (params.query !== undefined) thunkAPI.dispatch(SearchActions.setQuery(params.query))
      if (params.filters !== undefined) thunkAPI.dispatch(SearchActions.setFilters(params.filters))
    }
    try {
      return await fetchTags(thunkAPI.getState().search, 0)
    } catch (error) {
      const payload = await handleError(error, `search/newSearch`)
      return thunkAPI.rejectWithValue(payload)
    }
  },
)

/**
 * Search for more results using existing query, filters, and sort order
 */
export const moreSearch = createAsyncThunk<SearchPayload, undefined, ThunkApiConfig>(
  'search/moreSearch',
  async (_, thunkAPI) => {
    try {
      const searchState = thunkAPI.getState().search
      const start = searchState.results.allTagIds.length
      return await fetchTags(searchState, start)
    } catch (error) {
      const payload = await handleError(error, `search/moreSearch`)
      return thunkAPI.rejectWithValue(payload)
    }
  },
)

export const SearchActions = searchSlice.actions
export default searchSlice.reducer

export const selectSearchResults = (state: RootState): TagListState => {
  return {
    allTagIds: state.search.results.allTagIds,
    error: state.search.error,
    loadingState: state.search.loadingState,
    tagsById: state.search.results.tagsById,
    selectedTag: state.search.selectedTag,
    sortOrder: state.search.sortOrder,
  }
}
