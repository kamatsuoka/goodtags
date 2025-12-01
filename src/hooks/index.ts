import type { RootState } from '@app/store'
import { store } from '@app/store'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export type AppDispatch = typeof store.dispatch
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Export individual hook files
export * from './useBodyInsets'
export * from './useButtonDimming'
export * from './useFabDownStyle'
export * from './useHeaderHeight'
export * from './useHorizontalInset'
export * from './useNotePlayer'
export * from './usePdfCache'
export * from './useSelectedTag'
export * from './useTagEffects'
export * from './useTagListState'
export * from './useTagMedia'
export * from './useTagScreenStyles'
export * from './useTrackPlayer'
export * from './useWindowShape'
