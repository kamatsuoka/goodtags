import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit"
import {SearchParams, SortOrder} from "../constants/Search"
import {
  buildTagIds,
  CurrentTagVersion,
  SearchResult,
  SearchResultsById,
} from "../lib/models/Tag"
import {RootState} from "../store"
import {handleError} from "./handleError"
import {fetchAndConvertTags} from "./searchutil"
import {LoadingState, sortAlpha, TagListState} from "./tagLists"
import {SelectedTag} from "./tagListUtil"
import {ThunkApiConfig} from "./thunkApiConfig"

const MaxPopular = 50

// Define a type for the slice state
export interface PopularState {
  tagsById: SearchResultsById
  allTagIds: Array<number>
  selectedTag?: SelectedTag
  loadingState: LoadingState
  error?: string
  sortOrder: SortOrder
}

// Define the initial state using that type
export const initialState: PopularState = {
  loadingState: LoadingState.idle,
  tagsById: {},
  allTagIds: [],
  sortOrder: SortOrder.downloads,
}

/**
 * Sorts popular list by downloads
 */
function sortByDownloads(state: PopularState) {
  const downloads = (id: number) =>
    state.tagsById[id].downloaded ? state.tagsById[id].downloaded : 0
  state.allTagIds.sort((id1, id2) => downloads(id2) - downloads(id1))
}

export const popularSlice = createSlice({
  name: "popular",
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
    builder.addCase(getPopularTags.pending, (state, _) => {
      state.loadingState = LoadingState.pending
      state.error = undefined
    })
    builder.addCase(getPopularTags.fulfilled, (state, action) => {
      if (action.payload !== undefined) {
        const {tagsById, allTagIds} = buildTagIds(action.payload)
        state.tagsById = tagsById
        state.allTagIds = allTagIds
        // tags always come from server sorted by downloads
        if (state.sortOrder === SortOrder.alpha) {
          sortAlpha(state)
        }
      }
      state.loadingState = LoadingState.succeeded
    })
    builder.addCase(getPopularTags.rejected, (state, action) => {
      state.loadingState = LoadingState.failed
      state.error = action.payload
    })
  },
})

/**
 * Checks if any tags have an outdated version
 */
function outdatedSearchResults(
  tagsById: SearchResultsById,
  allTagIds: Array<number>,
): boolean {
  for (const id of allTagIds) {
    const tag = tagsById[id]
    if (!tag) {
      console.warn(`tag ${id} not found in cache`)
    } else {
      if (tag.version === undefined || tag.version < CurrentTagVersion)
        return true
    }
  }
  return false
}

// always sort by downloads when fetching from server
export const PopularSearchParams: SearchParams = {
  sortBy: SortOrder.downloads,
  limit: MaxPopular,
  requireSheetMusic: true,
}

/**
 * Fetch most popular tags from API
 *
 * @param refresh fetch tags even if already loaded
 */
export const getPopularTags = createAsyncThunk<
  SearchResult[] | undefined,
  boolean,
  ThunkApiConfig
>("popular/getPopularTags", async (refresh: boolean, thunkAPI) => {
  const state = thunkAPI.getState().popular
  if (
    refresh ||
    state.allTagIds.length === 0 ||
    outdatedSearchResults(state.tagsById, state.allTagIds)
  ) {
    try {
      const fetchResult = await fetchAndConvertTags(
        PopularSearchParams,
        false /* useApi */,
      )
      return fetchResult.tags
    } catch (error) {
      const payload = await handleError(error, `getPopularTags`)
      return thunkAPI.rejectWithValue(payload)
    }
  } else {
    // reuse existing values
    return undefined
  }
})

export const selectPopular = (state: RootState): TagListState => {
  return {
    allTagIds: state.popular.allTagIds,
    error: state.popular.error,
    loadingState: state.popular.loadingState,
    selectedTag: state.popular.selectedTag,
    sortOrder: state.popular.sortOrder,
    tagsById: state.popular.tagsById,
  }
}

export const PopularActions = popularSlice.actions
export default popularSlice.reducer
