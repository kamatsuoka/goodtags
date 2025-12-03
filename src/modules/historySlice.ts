import { SortOrder } from '@app/constants/Search'
import Tag from '@app/lib/models/Tag'
import { RootState } from '@app/store'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import _ from 'lodash'
import { refreshTag } from './refreshTagThunk'
import {
  InitialTagListState,
  sortAlpha,
  TagListEnum,
  TagListState,
} from './tagLists'

export type HistoryState = TagListState & {
  history: number[] // tag ids sorted by date seen, newest first
  lastModified?: string
}

export const InitialState: HistoryState = {
  ...InitialTagListState,
  history: [],
  lastModified: undefined,
}

export const MAX_HISTORY = 50

const historySlice = createSlice({
  name: 'history',
  initialState: InitialState,
  reducers: {
    addHistory: (
      state,
      action: PayloadAction<{ tag: Tag; timestamp?: string }>,
    ) => {
      // adds tag to history but does not change tagsById since that
      // would wreak havoc with history while viewing tags from history
      const tag = action.payload.tag
      const id = tag.id
      state.tagsById[id] = tag

      // first make sure tag is at head of history
      if (state.history.includes(id)) {
        // remove from history before adding to head
        _.pull(state.history, id)
      }
      state.history.unshift(id) // add tag to head of history

      // then remove oldest tag, if lists exceed max size
      if (state.history.length > MAX_HISTORY) {
        const oldestId = state.history.pop()!
        delete state.tagsById[oldestId]
      }
      state.lastModified = action.payload.timestamp || new Date().toISOString()
    },
    incorporateHistory: state => {
      // incorporate history into tag list for display
      state.allTagIds = [...state.history]
      // only need to sort if sorting by title
      if (state.sortOrder === SortOrder.alpha) {
        sortAlpha(state)
      }
    },
    clearHistory: state => {
      Object.assign(state, InitialState)
    },
    setSelectedTag: (state, action) => {
      state.selectedTag = action.payload
    },
    toggleSortOrder: state => {
      state.selectedTag = undefined
      if (state.sortOrder === SortOrder.newest) {
        // switch to alphabetical
        sortAlpha(state)
        state.sortOrder = SortOrder.alpha
      } else {
        // switch to newest
        state.allTagIds = [...state.history]
        state.sortOrder = SortOrder.newest
      }
    },
  },
  extraReducers: builder => {
    builder.addCase(refreshTag.fulfilled, (state, action) => {
      if (
        action.payload?.tagListType === TagListEnum.History &&
        action.payload.tag
      ) {
        const tag = action.payload.tag
        console.log(`Refreshing tag ${tag.id} in history slice`)
        if (state.tagsById[tag.id]) {
          state.tagsById[tag.id] = tag
        }
      }
    })
  },
})

export const selectHistory = (state: RootState): TagListState => {
  return {
    allTagIds: state.history.allTagIds,
    error: state.history.error,
    loadingState: state.history.loadingState,
    selectedTag: state.history.selectedTag,
    tagsById: state.history.tagsById,
    sortOrder: state.history.sortOrder,
  }
}

export const HistoryActions = historySlice.actions

export default historySlice.reducer
