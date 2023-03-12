import AsyncStorage from "@react-native-async-storage/async-storage"
import {AnyAction, configureStore} from "@reduxjs/toolkit"
import {combineReducers} from "redux"
import {persistReducer, persistStore} from "redux-persist"
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

const persistConfig = {
  timeout: 10000,
  key: "root",
  storage: AsyncStorage,
  stateReconciler: autoMergeLevel2,
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
export {store, persistor}
