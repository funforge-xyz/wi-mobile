
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export interface NearbyUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio: string;
  isOnline: boolean;
  distance?: number;
  isSameNetwork: boolean;
}

interface NearbyState {
  users: NearbyUser[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
  error: string | null;
}

const initialState: NearbyState = {
  users: [],
  loading: false,
  refreshing: false,
  loadingMore: false,
  lastDoc: null,
  hasMore: true,
  error: null,
};

// Async thunk for loading nearby users
export const loadNearbyUsers = createAsyncThunk(
  'nearby/loadUsers',
  async (params: { currentUserId: string; reset?: boolean; lastDoc?: QueryDocumentSnapshot | null }, { rejectWithValue }) => {
    try {
      const nearbyUtils = await import('../utils/nearbyUtils');
      const result = await nearbyUtils.loadNearbyUsers(params.currentUserId, params.lastDoc || null, 50);
      return { ...result, reset: params.reset };
    } catch (error) {
      console.error('Error loading nearby users:', error);
      return rejectWithValue('Failed to load nearby users');
    }
  }
);

const nearbySlice = createSlice({
  name: 'nearby',
  initialState,
  reducers: {
    clearNearbyData: (state) => {
      state.users = [];
      state.loading = false;
      state.refreshing = false;
      state.loadingMore = false;
      state.lastDoc = null;
      state.hasMore = true;
      state.error = null;
    },
    removeBlockedUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(user => user.id !== action.payload);
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.refreshing = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      // Clear all nearby data on logout
      state.users = [];
      state.loading = false;
      state.refreshing = false;
      state.loadingMore = false;
      state.lastDoc = null;
      state.hasMore = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadNearbyUsers.pending, (state, action) => {
        const { reset } = action.meta.arg;
        if (reset) {
          state.loading = true;
          state.error = null;
        } else {
          state.loadingMore = true;
        }
      })
      .addCase(loadNearbyUsers.fulfilled, (state, action) => {
        const { users, lastDoc, hasMore, reset } = action.payload;
        
        state.loading = false;
        state.refreshing = false;
        state.loadingMore = false;
        state.error = null;
        
        if (reset) {
          state.users = users;
        } else {
          state.users = [...state.users, ...users];
        }
        
        state.lastDoc = lastDoc;
        state.hasMore = hasMore;
      })
      .addCase(loadNearbyUsers.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.loadingMore = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearNearbyData,
  removeBlockedUser,
  setRefreshing,
  setError,
  logout,
} = nearbySlice.actions;

export default nearbySlice.reducer;
