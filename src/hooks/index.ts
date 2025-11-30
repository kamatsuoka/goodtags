import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../store'
import { store } from '../store'

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export type AppDispatch = typeof store.dispatch
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Export individual hook files
export { useBodyInsets } from './useBodyInsets'
export { useFabDownStyle } from './useFabDownStyle'
export { useHeaderHeight } from './useHeaderHeight'
export { useHorizontalInset } from './useHorizontalInset'
export { useSelectedTag } from './useSelectedTag'
export { useTagListState } from './useTagListState'
export { useWindowShape } from './useWindowShape'
