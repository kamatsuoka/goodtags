import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit"
import {SearchParams, SortOrder} from "../constants/Search"
import {buildTagIds, SearchResult, SearchResultsById} from "../lib/models/Tag"
import {RootState} from "../store"
import {handleError} from "./handleError"
import {fetchAndConvertTags} from "./searchutil"
import {LoadingState, sortAlpha, TagListState} from "./tagLists"
import {SelectedTag} from "./tagListUtil"
import {ThunkApiConfig} from "./thunkApiConfig"

// Define a type for the slice state
export interface NewState {
  tagsById: SearchResultsById
  allTagIds: Array<number>
  selectedTag?: SelectedTag
  loadingState: LoadingState
  error?: string
  sortOrder: SortOrder
}

// Define the initial state using that type
export const initialState: NewState = {
  loadingState: LoadingState.idle,
  tagsById: {},
  allTagIds: [],
  sortOrder: SortOrder.alpha,
}

/**
 * Sorts new list by id
 */
function sortById(state: NewState) {
  state.allTagIds.sort((id1, id2) => id1 - id2)
}

export const newSlice = createSlice({
  name: "new",
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
    builder.addCase(getNewTags.pending, (state, _) => {
      state.loadingState = LoadingState.pending
      state.error = undefined
    })
    builder.addCase(getNewTags.fulfilled, (state, action) => {
      if (action.payload !== undefined) {
        const {tagsById, allTagIds} = buildTagIds(action.payload)
        state.tagsById = tagsById
        state.allTagIds = allTagIds
      }
      state.loadingState = LoadingState.succeeded
    })
    builder.addCase(getNewTags.rejected, (state, action) => {
      state.loadingState = LoadingState.failed
      state.error = action.payload
    })
  },
})

export const NewSearchParams: SearchParams = {
  sortBy: SortOrder.id,
  requireSheetMusic: true,
  limit: 20,
}

/**
 * Fetch most new tags from API
 *
 * @param refresh fetch tags even if already loaded
 */
export const getNewTags = createAsyncThunk<
  SearchResult[] | undefined,
  boolean,
  ThunkApiConfig
>("new/getNewTags", async (refresh: boolean, thunkAPI) => {
  const state = thunkAPI.getState().new
  if (refresh || state.allTagIds.length === 0) {
    try {
      const fetchResult = await fetchAndConvertTags(
        NewSearchParams,
        false /* useApi */,
      )
      console.log(`getNewTags fetched ${fetchResult.tags.length} tags`)
      return fetchResult.tags
    } catch (error) {
      const payload = await handleError(error, `getNewTags`)
      return thunkAPI.rejectWithValue(payload)
    }
  } else {
    // reuse existing values
    return undefined
  }
})

export const selectNew = (state: RootState): TagListState => {
  return {
    allTagIds: state.new.allTagIds,
    error: state.new.error,
    loadingState: state.new.loadingState,
    selectedTag: state.new.selectedTag,
    sortOrder: state.new.sortOrder,
    tagsById: state.new.tagsById,
  }
}

export const NewActions = newSlice.actions
export default newSlice.reducer
