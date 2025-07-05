
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
  hasMore: boolean;
  error: string | null;
  currentPage: number;
}

const initialState: NearbyState = {
  users: [],
  loading: false,
  refreshing: false,
  loadingMore: false,
  hasMore: true,
  error: null,
  currentPage: 0,
};

// Async thunk for loading nearby users
export const loadNearbyUsers = createAsyncThunk(
  'nearby/loadUsers',
  async (params: { currentUserId: string; reset?: boolean; page?: number }, { rejectWithValue, getState }) => {
    try {
      const nearbyUtils = await import('../utils/nearbyUtils');
      const state = getState() as any;
      const currentPage = params.reset ? 0 : (params.page ?? state.nearby.currentPage);
      
      const result = await nearbyUtils.loadNearbyUsers(params.currentUserId, null, 50, currentPage);
      
      return { 
        users: result.users, 
        hasMore: result.hasMore,
        reset: params.reset,
        page: currentPage
      };
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
      state.hasMore = true;
      state.error = null;
      state.currentPage = 0;
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
      state.hasMore = true;
      state.error = null;
      state.currentPage = 0;
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
        const { users, hasMore, reset, page } = action.payload;
        
        state.loading = false;
        state.refreshing = false;
        state.loadingMore = false;
        state.error = null;
        
        if (reset) {
          state.users = users;
          state.currentPage = 0;
        } else {
          state.users = [...state.users, ...users];
          state.currentPage = page + 1;
        }
        
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
