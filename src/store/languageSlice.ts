
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LanguageState {
  currentLanguage: string;
}

const initialState: LanguageState = {
  currentLanguage: 'en', // Default language
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      state.currentLanguage = action.payload;
    },
    logout: (state) => {
      // Preserve language state on logout - no changes needed
    },
  },
});

export const { setLanguage, logout } = languageSlice.actions;
export default languageSlice.reducer;
