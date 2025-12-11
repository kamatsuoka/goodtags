import AsyncStorage from '@react-native-async-storage/async-storage'
import { AnyAction, configureStore } from '@reduxjs/toolkit'
import _ from 'lodash'
import { combineReducers } from 'redux'
import type { MigrationManifest } from 'redux-persist'
import { createMigrate, persistReducer, persistStore } from 'redux-persist'
import autoMergeLevel2 from 'redux-persist/es/stateReconciler/autoMergeLevel2'
import classicReducer from './modules/classicSlice'
import easyReducer from './modules/easySlice'
import favoritesReducer from './modules/favoritesSlice'
import historyReducer from './modules/historySlice'
import newReducer from './modules/newSlice'
import optionsReducer from './modules/optionsSlice'
import popularReducer from './modules/popularSlice'
import randomReducer from './modules/randomSlice'
import searchReducer from './modules/searchSlice'
import tracksReducer from './modules/tracksSlice'
import visitReducer from './modules/visitSlice'

const rootReducer = combineReducers({
  search: searchReducer,
  popular: popularReducer,
  classic: classicReducer,
  easy: easyReducer,
  new: newReducer,
  visit: visitReducer,
  favorites: favoritesReducer,
  history: historyReducer,
  tracks: tracksReducer,
  options: optionsReducer,
  random: randomReducer,
})

export type AppState = ReturnType<typeof rootReducer>

// NOTE! This should be an append-only "list" with each addition having the next incremental integer.
//
// In particular, the only time it *might* be safe to mutate (or remove) existing migrations is when the migrations
// haven't made it out to any users devices yet (eg before deployment).
const MIGRATIONS = {
  0: (state: AppState) => {
    state.search.filters.offline = true
    return state
  },
}

const persistConfig = {
  timeout: 10000,
  key: 'root',
  storage: AsyncStorage,
  stateReconciler: autoMergeLevel2,
  version: _.max(Object.keys(MIGRATIONS).map(key => parseInt(key, 10))) ?? -1,
  // The types for `createMigrate` seem just quite wrong, in particular the migration function arg/return type
  migrate: createMigrate(MIGRATIONS as unknown as MigrationManifest, {
    debug: true,
  }),
}

console.log(`[Redux Persist] persistConfig.version=${persistConfig.version}`)

const persistedReducer = persistReducer<AppState, AnyAction>(persistConfig, rootReducer)

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }),
})

// Add debugging before persistStore to check what's in AsyncStorage
// Only run this outside of test environments
if (process.env.NODE_ENV !== 'test') {
  AsyncStorage.getItem('persist:root')
    .then(data => {
      console.log('[Redux Persist] Raw AsyncStorage data exists:', !!data)
      if (data) {
        console.log('[Redux Persist] Data size:', data.length, 'bytes')
        try {
          const parsed = JSON.parse(data)
          console.log('[Redux Persist] Persisted keys:', Object.keys(parsed))
        } catch (e) {
          console.error('[Redux Persist] Failed to parse stored data:', e)
        }
      }
    })
    .catch(e => console.error('[Redux Persist] Error reading AsyncStorage:', e))
}

const persistor = persistStore(store, null, () => {
  console.log('[Redux Persist] Rehydration complete')
  // Log a sample of the rehydrated state to verify data is present
  const state = store.getState()
  console.log('[Redux Persist] Favorites count:', state.favorites?.allTagIds?.length ?? 0)
  console.log('[Redux Persist] Labels:', state.favorites?.labels?.length ?? 0)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export { persistor, store }
