import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Collection, SearchParams, SortOrder } from '../constants/Search'
import { buildTagIds, SearchResult, SearchResultsById } from '../lib/models/Tag'
import { RootState } from '../store'
import { handleError } from './handleError'
import { fetchAndConvertTags } from './searchutil'
import { LoadingState, sortAlpha, TagListState } from './tagLists'
import { SelectedTag } from './tagListUtil'
import { ThunkApiConfig } from './thunkApiConfig'

// Define a type for the slice state
export interface EasyState {
  tagsById: SearchResultsById
  allTagIds: Array<number>
  selectedTag?: SelectedTag
  loadingState: LoadingState
  error?: string
  sortOrder: SortOrder
}

// Define the initial state using that type
export const initialState: EasyState = {
  loadingState: LoadingState.idle,
  tagsById: {},
  allTagIds: [],
  sortOrder: SortOrder.alpha,
}

/**
 * Sorts easy list by id
 */
function sortById(state: EasyState) {
  state.allTagIds.sort((id1, id2) => id1 - id2)
}

export const easySlice = createSlice({
  name: 'easy',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    reset: state => {
      state.tagsById = {}
      state.allTagIds = []
    },
    setLoadingState: (state, action: PayloadAction<LoadingState>) => {
      state.loadingState = action.payload
    },
    setSelectedTag: (state, action) => {
      state.selectedTag = action.payload
    },
    toggleSortOrder: state => {
      state.selectedTag = undefined
      if (state.sortOrder === SortOrder.id) {
        sortAlpha(state)
        state.sortOrder = SortOrder.alpha
      } else {
        sortById(state)
        state.sortOrder = SortOrder.id
      }
    },
  },
  extraReducers: builder => {
    builder.addCase(getEasyTags.pending, (state, _) => {
      state.loadingState = LoadingState.pending
      state.error = undefined
    })
    builder.addCase(getEasyTags.fulfilled, (state, action) => {
      if (action.payload !== undefined) {
        const { tagsById, allTagIds } = buildTagIds(action.payload)
        state.tagsById = tagsById
        state.allTagIds = allTagIds
      }
      state.loadingState = LoadingState.succeeded
    })
    builder.addCase(getEasyTags.rejected, (state, action) => {
      state.loadingState = LoadingState.failed
      state.error = action.payload
    })
  },
})

export const EasySearchParams: SearchParams = {
  collection: Collection.EASY,
  requireSheetMusic: true,
  limit: 125,
}

/**
 * Fetch most easy tags from API
 *
 * @param refresh fetch tags even if already loaded
 */
export const getEasyTags = createAsyncThunk<
  SearchResult[] | undefined,
  boolean,
  ThunkApiConfig
>('easy/getEasyTags', async (refresh: boolean, thunkAPI) => {
  const state = thunkAPI.getState().easy
  if (refresh || state.allTagIds.length === 0) {
    try {
      const fetchResult = await fetchAndConvertTags(
        { ...EasySearchParams, sortBy: state.sortOrder },
        false /* useApi */,
      )
      return fetchResult.tags
    } catch (error) {
      const payload = await handleError(error, `getEasyTags`)
      return thunkAPI.rejectWithValue(payload)
    }
  } else {
    // reuse existing values
    return undefined
  }
})

export const selectEasy = (state: RootState): TagListState => {
  return {
    allTagIds: state.easy.allTagIds,
    error: state.easy.error,
    loadingState: state.easy.loadingState,
    selectedTag: state.easy.selectedTag,
    sortOrder: state.easy.sortOrder,
    tagsById: state.easy.tagsById,
  }
}

export const EasyActions = easySlice.actions
export default easySlice.reducer
