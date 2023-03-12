import {TypedUseSelectorHook, useDispatch, useSelector} from "react-redux"
import type {RootState} from "./store"
import {store} from "./store"

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export type AppDispatch = typeof store.dispatch
export const useAppDispatch: () => AppDispatch = useDispatch // Export a hook that can be reused to resolve types
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
