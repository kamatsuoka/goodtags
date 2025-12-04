import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Define a type for the slice state
export interface OptionsState {
  serifs: boolean
  showStatusBar: boolean
  keepAwake: boolean
}

// Define the initial state using that type
export const initialState: OptionsState = {
  serifs: true,
  showStatusBar: false,
  keepAwake: true,
}
export const optionsSlice = createSlice({
  name: 'options',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setSerifs: (state, action: PayloadAction<boolean>) => {
      state.serifs = action.payload
    },
    setShowStatusBar: (state, action: PayloadAction<boolean>) => {
      state.showStatusBar = action.payload
    },
    setKeepAwake: (state, action: PayloadAction<boolean>) => {
      state.keepAwake = action.payload
    },
  },
})

export const OptionsActions = optionsSlice.actions
export default optionsSlice.reducer
