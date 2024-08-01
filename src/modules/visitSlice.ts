import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import {TagListType} from "./tagLists"

export enum TagState {
  opening = "opening",
  closing = "closing",
}

export interface VisitState {
  // Keeps track of user's last visit.
  // Used to decide whether to show welcome screen
  lastVisited?: string
  tagState?: TagState
  tagListType: TagListType | string
}

const initialState: VisitState = {
  tagListType: TagListType.Popular,
}

export const visitSlice = createSlice({
  name: "visit",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setLastVisited: state => {
      state.lastVisited = new Date().toISOString()
    },
    clearLastVisited: state => {
      state.lastVisited = undefined
    },
    setTagState: (state, action: PayloadAction<TagState | undefined>) => {
      state.tagState = action.payload
    },
    setTagListType: (state, action: PayloadAction<TagListType | string>) => {
      state.tagListType = action.payload
    },
  },
})

export const {setLastVisited, clearLastVisited, setTagState, setTagListType} =
  visitSlice.actions
export default visitSlice.reducer
