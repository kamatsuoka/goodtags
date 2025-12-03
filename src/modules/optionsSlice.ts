import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Define a type for the slice state
export interface OptionsState {
  serifs: boolean
  autoRotate: boolean
  autoRotateDelay: number
  showStatusBar: boolean
  keepAwake: boolean
}

// Define the initial state using that type
export const initialState: OptionsState = {
  serifs: true,
  autoRotate: false,
  autoRotateDelay: 200,
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
    setAutoRotate: (state, action: PayloadAction<boolean>) => {
      state.autoRotate = action.payload
    },
    setAutoRotateDelay: (state, action: PayloadAction<number>) => {
      state.autoRotateDelay = action.payload
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
