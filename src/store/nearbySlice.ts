
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
      if (!params.currentUserId) {
        throw new Error('User ID is required');
      }

      const nearbyUtils = await import('../utils/nearbyUtils');
      const state = getState() as any;
      const currentPage = params.reset ? 0 : (params.page ?? (state.nearby.currentPage));
      
      console.log('Loading nearby users:', { currentUserId: params.currentUserId, page: currentPage, reset: params.reset });
      
      const result = await nearbyUtils.loadNearbyUsers(params.currentUserId, null, 50, currentPage);
      
      console.log('Nearby users result:', result);
      
      return { 
        users: result.users || [], 
        hasMore: result.hasMore || false,
        reset: params.reset || false,
        page: currentPage
      };
    } catch (error) {
      console.error('Error loading nearby users:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load nearby users');
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
    removeUserFromNearby: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(user => user.id !== action.payload);
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
        state.error = null;
        
        if (reset && state.users.length === 0) {
          // Only show skeleton on initial load (when no users exist)
          state.loading = true;
          state.refreshing = false;
          state.loadingMore = false;
        } else if (reset && state.users.length > 0) {
          // This is a refresh operation
          state.loading = false;
          state.refreshing = true;
          state.loadingMore = false;
        } else {
          // This is load more
          state.loadingMore = true;
          state.loading = false;
          state.refreshing = false;
        }
      })
      .addCase(loadNearbyUsers.fulfilled, (state, action) => {
        const { users, hasMore, reset, page } = action.payload;
        
        // Clear all loading states
        state.loading = false;
        state.refreshing = false;
        state.loadingMore = false;
        state.error = null;
        
        if (reset) {
          state.users = users;
          state.currentPage = page;
        } else {
          state.users = [...state.users, ...users];
          state.currentPage = page;
        }
        
        state.hasMore = hasMore;
      })
      .addCase(loadNearbyUsers.rejected, (state, action) => {
        console.error('loadNearbyUsers rejected:', action.payload);
        
        // Clear all loading states on error
        state.loading = false;
        state.refreshing = false;
        state.loadingMore = false;
        state.error = action.payload as string;
        
        // If this was the initial load and it failed, ensure we don't show skeleton forever
        if (state.users.length === 0) {
          state.users = [];
          state.hasMore = false;
        }
      });
  },
});

export const {
  clearNearbyData,
  removeUserFromNearby,
  removeBlockedUser,
  setRefreshing,
  setError,
  logout,
} = nearbySlice.actions;

export default nearbySlice.reducer;
