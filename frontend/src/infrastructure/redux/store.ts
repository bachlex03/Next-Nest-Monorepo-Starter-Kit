import { persistStore, persistReducer, FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from 'redux-persist'
import { PersistConfig } from 'redux-persist/es/types'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useSelector } from 'react-redux'

import { createPersistStorage } from './persist-storage'
import authReducer from './slices/auth.slice'

import { jsonplaceholderApi } from './apis/jsonplaceholder.api'

const storage = createPersistStorage()

const persistConfig: PersistConfig<ReturnType<typeof reducers>> = {
  key: 'root',
  version: 1,
  storage: storage,
  blacklist: [jsonplaceholderApi.reducerPath], // Add the blacklist option
  whitelist: ['auth'],
}

const reducers = combineReducers({
  auth: authReducer,
  [jsonplaceholderApi.reducerPath]: jsonplaceholderApi.reducer,
})

const persistedReducer = persistReducer(persistConfig, reducers)

export const reduxStore = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware: any) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(jsonplaceholderApi.middleware),
})

export const persistor = persistStore(reduxStore)

export type RootState = ReturnType<typeof reduxStore.getState>
export type AppDispatch = typeof reduxStore.dispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
