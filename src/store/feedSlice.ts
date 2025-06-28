
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  mediaURL?: string;
  mediaType?: 'image' | 'video';
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  showLikeCount: boolean;
  allowComments: boolean;
  isPrivate: boolean;
  isLikedByUser?: boolean;
}

interface FeedState {
  posts: FeedPost[];
  loading: boolean;
  error: string | null;
  lastFetch: number;
  hasMore: boolean;
}

const initialState: FeedState = {
  posts: [],
  loading: false,
  error: null,
  lastFetch: 0,
  hasMore: true,
};

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setPosts: (state, action: PayloadAction<FeedPost[]>) => {
      state.posts = action.payload;
      state.lastFetch = Date.now();
    },
    addPost: (state, action: PayloadAction<FeedPost>) => {
      state.posts.unshift(action.payload);
    },
    updatePost: (state, action: PayloadAction<{ postId: string; updates: Partial<FeedPost> }>) => {
      const { postId, updates } = action.payload;
      const postIndex = state.posts.findIndex(post => post.id === postId);
      if (postIndex !== -1) {
        state.posts[postIndex] = { ...state.posts[postIndex], ...updates };
      }
    },
    removePost: (state, action: PayloadAction<string>) => {
      state.posts = state.posts.filter(post => post.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setHasMore: (state, action: PayloadAction<boolean>) => {
      state.hasMore = action.payload;
    },
    clearFeedData: (state) => {
      state.posts = [];
      state.loading = false;
      state.error = null;
      state.lastFetch = 0;
      state.hasMore = true;
    },
    logout: (state) => {
      // Clear all feed data on logout
      state.posts = [];
      state.loading = false;
      state.error = null;
      state.lastFetch = 0;
      state.hasMore = true;
    },
  },
});

export const {
  setPosts,
  addPost,
  updatePost,
  removePost,
  setLoading,
  setError,
  setHasMore,
  clearFeedData,
  logout,
} = feedSlice.actions;

export default feedSlice.reducer;
