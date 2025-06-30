
import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './themeSlice';
import userReducer from './userSlice';
import feedReducer from './feedSlice';
import connectionsReducer from './connectionsSlice';
import languageReducer from './languageSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    user: userReducer,
    feed: feedReducer,
    connections: connectionsReducer,
    language: languageReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
