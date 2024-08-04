import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit"
import {Collection, SearchParams, SortOrder} from "../constants/Search"
import {buildTagIds, SearchResult, SearchResultsById} from "../lib/models/Tag"
import {RootState} from "../store"
import {handleError} from "./handleError"
import {fetchAndConvertTags} from "./searchutil"
import {LoadingState, sortAlpha, TagListState} from "./tagLists"
import {SelectedTag} from "./tagListUtil"
import {ThunkApiConfig} from "./thunkApiConfig"

// Define a type for the slice state
export interface ClassicState {
  tagsById: SearchResultsById
  allTagIds: Array<number>
  selectedTag?: SelectedTag
  loadingState: LoadingState
  error?: string
  sortOrder: SortOrder
}

// Define the initial state using that type
export const initialState: ClassicState = {
  loadingState: LoadingState.idle,
  tagsById: {},
  allTagIds: [],
  sortOrder: SortOrder.alpha,
}

/**
 * Sorts classic list by downloads
 */
function sortByDownloads(state: ClassicState) {
  const downloads = (id: number) =>
    state.tagsById[id].downloaded ? state.tagsById[id].downloaded : 0
  state.allTagIds.sort((id1, id2) => downloads(id2) - downloads(id1))
}

export const classicSlice = createSlice({
  name: "classic",
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
      if (state.sortOrder === SortOrder.downloads) {
        // switch to alphabetical
        sortAlpha(state)
        state.sortOrder = SortOrder.alpha
      } else {
        // switch to newest
        sortByDownloads(state)
        state.sortOrder = SortOrder.downloads
      }
    },
  },
  extraReducers: builder => {
    builder.addCase(getClassicTags.pending, (state, _) => {
      state.loadingState = LoadingState.pending
      state.error = undefined
    })
    builder.addCase(getClassicTags.fulfilled, (state, action) => {
      if (action.payload !== undefined) {
        const {tagsById, allTagIds} = buildTagIds(action.payload)
        state.tagsById = tagsById
        state.allTagIds = allTagIds
      }
      state.loadingState = LoadingState.succeeded
    })
    builder.addCase(getClassicTags.rejected, (state, action) => {
      state.loadingState = LoadingState.failed
      state.error = action.payload
    })
  },
})

// always sort by downloads when fetching from server
export const ClassicSearchParams: SearchParams = {
  collection: Collection.CLASSIC,
  sortBy: SortOrder.alpha,
  requireSheetMusic: true,
  limit: 125,
}

/**
 * Fetch most classic tags from API
 *
 * @param refresh fetch tags even if already loaded
 */
export const getClassicTags = createAsyncThunk<
  SearchResult[] | undefined,
  boolean,
  ThunkApiConfig
>("classic/getClassicTags", async (refresh: boolean, thunkAPI) => {
  const state = thunkAPI.getState().classic
  if (refresh || state.allTagIds.length === 0) {
    try {
      const fetchResult = await fetchAndConvertTags(
        ClassicSearchParams,
        false /* useApi */,
      )
      return fetchResult.tags
    } catch (error) {
      const payload = await handleError(error, `getClassicTags`)
      return thunkAPI.rejectWithValue(payload)
    }
  } else {
    // reuse existing values
    return undefined
  }
})

export const selectClassic = (state: RootState): TagListState => {
  return {
    allTagIds: state.classic.allTagIds,
    error: state.classic.error,
    loadingState: state.classic.loadingState,
    selectedTag: state.classic.selectedTag,
    sortOrder: SortOrder.alpha,
    tagsById: state.classic.tagsById,
  }
}

export const ClassicActions = classicSlice.actions
export default classicSlice.reducer
