// slice for fetching a random tag
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SearchParams, SortOrder } from '../constants/Search'
import { SearchResult } from '../lib/models/Tag'
import { RootState } from '../store'
import { handleError } from './handleError'
import { countTags, fetchAndConvertTags } from './searchutil'
import { LoadingState } from './tagLists'
import { ThunkApiConfig } from './thunkApiConfig'

// Define a type for the slice state
export interface RandomState {
  randomTag?: SearchResult
  loadingState: LoadingState
  error?: string
}

// Define the initial state using that type
export const initialState: RandomState = {
  loadingState: LoadingState.idle,
}

export const randomSlice = createSlice({
  name: 'random',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    reset: state => {
      state.randomTag = undefined
      state.loadingState = LoadingState.idle
      state.error = undefined
    },
    setLoadingState: (state, action: PayloadAction<LoadingState>) => {
      state.loadingState = action.payload
    },
  },
  extraReducers: builder => {
    builder.addCase(getRandomTag.pending, (state, _) => {
      state.loadingState = LoadingState.pending
      state.error = undefined
    })
    builder.addCase(getRandomTag.fulfilled, (state, action) => {
      if (action.payload) {
        state.randomTag = action.payload
      }
      state.loadingState = LoadingState.succeeded
    })
    builder.addCase(getRandomTag.rejected, (state, action) => {
      state.loadingState = LoadingState.failed
      state.error = action.payload
    })
  },
})

export const RandomSearchParams: SearchParams = {
  requireSheetMusic: true,
  sortBy: SortOrder.id,
  limit: 50,
}

/**
 * Fetch random tag from API
 */
export const getRandomTag = createAsyncThunk<
  SearchResult,
  void,
  ThunkApiConfig
>('random/getRandomTag', async (_, thunkAPI) => {
  try {
    const tagCount = await countTags()
    const randomOffset = Math.floor(Math.random() * tagCount)
    const fetchResult = await fetchAndConvertTags(
      { ...RandomSearchParams, offset: randomOffset },
      false /* useApi */,
    )
    return fetchResult.tags[0] // Will be undefined if array is empty
  } catch (error) {
    const payload = await handleError(error, 'getRandomTag')
    return thunkAPI.rejectWithValue(payload)
  }
})

export const selectRandomTag = (state: RootState): SearchResult | undefined => {
  return state.random.randomTag
}

export const RandomActions = randomSlice.actions
export default randomSlice.reducer
