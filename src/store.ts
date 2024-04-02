import {Mode} from "@app/constants/Search"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {AnyAction, configureStore} from "@reduxjs/toolkit"
import _ from "lodash"
import {combineReducers} from "redux"
import type {MigrationManifest} from "redux-persist"
import {createMigrate, persistReducer, persistStore} from "redux-persist"
import autoMergeLevel2 from "redux-persist/es/stateReconciler/autoMergeLevel2"
import favoritesReducer from "./modules/favoritesSlice"
import historyReducer from "./modules/historySlice"
import optionsReducer from "./modules/optionsSlice"
import popularReducer from "./modules/popularSlice"
import searchReducer from "./modules/searchSlice"
import tracksReducer from "./modules/tracksSlice"
import visitReducer from "./modules/visitSlice"

const rootReducer = combineReducers({
  search: searchReducer,
  popular: popularReducer,
  visit: visitReducer,
  favorites: favoritesReducer,
  history: historyReducer,
  tracks: tracksReducer,
  options: optionsReducer,
})

export type AppState = ReturnType<typeof rootReducer>

const MIGRATIONS = {
  0: (state: AppState) => {
    state.search.filters.mode = Mode.OFFLINE
    return state
  },
}

const persistConfig = {
  timeout: 10000,
  key: "root",
  storage: AsyncStorage,
  stateReconciler: autoMergeLevel2,
  version: _.max(Object.keys(MIGRATIONS).map(parseInt)) ?? -1,
  // The types for `createMigrate` seem just quite wrong, in particular the migration function arg/return type
  migrate: createMigrate(MIGRATIONS as unknown as MigrationManifest),
}

const persistedReducer = persistReducer<AppState, AnyAction>(
  persistConfig,
  rootReducer,
)

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }),
})

const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export {persistor, store}
