import {Platform} from "react-native"
import {useSafeAreaInsets} from "react-native-safe-area-context"
import {TypedUseSelectorHook, useDispatch, useSelector} from "react-redux"
import type {RootState} from "./store"
import {store} from "./store"

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export type AppDispatch = typeof store.dispatch
export const useAppDispatch: () => AppDispatch = useDispatch // Export a hook that can be reused to resolve types
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
export const useBodyInsets = () => {
  const insets = useSafeAreaInsets()
  const paddingLeft = Platform.OS === "ios" ? insets.left : 0
  const paddingRight = Platform.OS === "ios" ? insets.right : 0
  return {paddingLeft, paddingRight}
}
export const useHorizontalInset = () => {
  const insets = useSafeAreaInsets()
  const paddingHorizontal = Math.max(insets.left, insets.right)
  return paddingHorizontal
}
