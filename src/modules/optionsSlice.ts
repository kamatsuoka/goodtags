import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import {Platform} from "react-native"
import {isTablet} from "react-native-device-info"

// Define a type for the slice state
export interface OptionsState {
  haptics: boolean
  serifs: boolean
  autoRotate: boolean
  autoRotateDelay: number
}

// Define the initial state using that type
export const initialState: OptionsState = {
  haptics: Platform.OS === "ios",
  serifs: true,
  autoRotate: !isTablet(),
  autoRotateDelay: 200,
}
export const optionsSlice = createSlice({
  name: "options",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setHaptics: (state, action: PayloadAction<boolean>) => {
      state.haptics = action.payload
    },
    setSerifs: (state, action: PayloadAction<boolean>) => {
      state.serifs = action.payload
    },
    setAutoRotate: (state, action: PayloadAction<boolean>) => {
      state.autoRotate = action.payload
    },
    setAutoRotateDelay: (state, action: PayloadAction<number>) => {
      state.autoRotateDelay = action.payload
    },
  },
})

export const OptionsActions = optionsSlice.actions
export default optionsSlice.reducer
