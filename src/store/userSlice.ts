import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  thumbnailURL: string;
  bio: string;
  postsCount: number;
  connectionsCount: number;
  lastUpdated: number;
}

export interface UserPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  mediaURL?: string;
  mediaType?: 'image' | 'video';
  createdAt: string; // ISO string format for Redux serialization
  likesCount: number;
  commentsCount: number;
  showLikeCount: boolean;
  allowComments: boolean;
  isPrivate: boolean;
  isLikedByUser?: boolean;
}

interface UserState {
  profile: UserProfile | null;
  posts: UserPost[];
  loading: boolean;
  postsLoading: boolean;
  error: string | null;
  lastProfileFetch: number;
  lastPostsFetch: number;
}

const initialState: UserState = {
  profile: null,
  posts: [],
  loading: false,
  postsLoading: false,
  error: null,
  lastProfileFetch: 0,
  lastPostsFetch: 0,
};

// Async thunk for fetching user profile
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      // Get user's post count
      const postsCollection = collection(firestore, 'posts');
      const userPostsQuery = query(postsCollection, where('authorId', '==', userId));
      const userPostsSnapshot = await getDocs(userPostsQuery);
      const postsCount = userPostsSnapshot.size;

      // Get user's connections count
      const connectionsQuery = query(
        collection(firestore, 'connections'),
        where('participants', 'array-contains', userId),
        where('status', '==', 'active')
      );
      const connectionsSnapshot = await getDocs(connectionsQuery);
      const connectionsCount = connectionsSnapshot.size;

      if (userDoc.exists()) {
        const firestoreData = userDoc.data();
        const profile: UserProfile = {
          id: userId,
          firstName: firestoreData.firstName || '',
          lastName: firestoreData.lastName || '',
          email: firestoreData.email || '',
          photoURL: firestoreData.photoURL || '',
          thumbnailURL: firestoreData.thumbnailURL || firestoreData.photoURL || '',
          bio: firestoreData.bio || '',
          postsCount,
          connectionsCount,
          lastUpdated: Date.now(),
        };
        return profile;
      } else {
        // Return default profile if no document exists
        const profile: UserProfile = {
          id: userId,
          firstName: '',
          lastName: '',
          email: '',
          photoURL: '',
          thumbnailURL: '',
          bio: '',
          postsCount,
          connectionsCount,
          lastUpdated: Date.now(),
        };
        return profile;
      }
    } catch (error) {
      return rejectWithValue('Failed to fetch user profile');
    }
  }
);

// Async thunk for fetching user posts
export const fetchUserPosts = createAsyncThunk(
  'user/fetchPosts',
  async (userId: string, { rejectWithValue }) => {
    try {
      console.log('Fetching posts for user:', userId);

      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000);
      });

      const firestore = getFirestore();

      // Wrap the main operation in a timeout
      const fetchOperation = async () => {
        // Get current user data once
        const userDoc = await getDoc(doc(firestore, 'users', userId));
      const currentUserData = userDoc.exists() ? userDoc.data() : {};

      // Get user's posts with limit for better performance
      const postsCollection = collection(firestore, 'posts');
      const postsQuery = query(
        postsCollection,
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50) // Limit to 50 most recent posts
      );

      const postsSnapshot = await getDocs(postsQuery);
      console.log('Found', postsSnapshot.size, 'posts');

      // Batch all subcollection queries
      const postIds = postsSnapshot.docs.map(postDoc => postDoc.id);

      // Create batched queries for likes and comments
      const likesPromises = postIds.map(postId => 
        getDocs(collection(firestore, 'posts', postId, 'likes'))
      );
      const commentsPromises = postIds.map(postId => 
        getDocs(collection(firestore, 'posts', postId, 'comments'))
      );

      // Execute all queries in parallel
      const [likesResults, commentsResults] = await Promise.all([
        Promise.all(likesPromises),
        Promise.all(commentsPromises)
      ]);

      const userPosts: UserPost[] = [];

      postsSnapshot.docs.forEach((postDoc, index) => {
        const postData = postDoc.data();
        const likesSnapshot = likesResults[index];
        const commentsSnapshot = commentsResults[index];

        // Check if user liked this post
        let isLikedByUser = false;
        likesSnapshot.forEach((likeDoc) => {
          if (likeDoc.data().authorId === userId) {
            isLikedByUser = true;
          }
        });

        userPosts.push({
          id: postDoc.id,
          authorId: postData.authorId,
          authorName: currentUserData.firstName && currentUserData.lastName 
            ? `${currentUserData.firstName} ${currentUserData.lastName}` 
            : 'You',
          authorPhotoURL: currentUserData.thumbnailURL || currentUserData.photoURL || '',
          content: postData.content || '',
          mediaURL: postData.mediaURL || '',
          mediaType: postData.mediaType || 'image',
          createdAt: postData.createdAt?.toDate ? 
                     postData.createdAt.toDate().toISOString() : 
                     (postData.createdAt instanceof Date ? 
                      postData.createdAt.toISOString() : 
                      new Date().toISOString()),
          likesCount: likesSnapshot.size,
          commentsCount: commentsSnapshot.size,
          showLikeCount: postData.showLikeCount !== false,
          allowComments: postData.allowComments !== false,
          isPrivate: postData.isPrivate || false,
          isLikedByUser: isLikedByUser,
        });
      });

      // Posts are already ordered by the query, no need to sort again
        console.log('Returning', userPosts.length, 'posts');
        return userPosts;
      };

      // Race between the fetch operation and timeout
      return await Promise.race([fetchOperation(), timeoutPromise]);
    } catch (error: any) {
      console.error('Error fetching user posts:', error);

      // Handle specific Firebase errors
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        console.error('Index not ready yet, retrying in a moment...');
        return rejectWithValue('Index not ready');
      }

      return rejectWithValue(error?.message || 'Failed to fetch user posts');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload, lastUpdated: Date.now() };
      }
    },
    clearUserData: (state) => {
      state.profile = null;
      state.posts = [];
      state.error = null;
      state.lastProfileFetch = 0;
      state.lastPostsFetch = 0;
    },
    addPost: (state, action: PayloadAction<UserPost>) => {
      state.posts.unshift(action.payload);
      if (state.profile) {
        state.profile.postsCount += 1;
      }
    },
    updatePost: (state, action: PayloadAction<{ postId: string; updates: Partial<UserPost> }>) => {
      const { postId, updates } = action.payload;
      const postIndex = state.posts.findIndex(post => post.id === postId);
      if (postIndex !== -1) {
        state.posts[postIndex] = { ...state.posts[postIndex], ...updates };
      }
    },
    removePost: (state, action: PayloadAction<string>) => {
      state.posts = state.posts.filter(post => post.id !== action.payload);
      if (state.profile) {
        state.profile.postsCount = Math.max(0, state.profile.postsCount - 1);
      }
    },
    updatePostLike: (state, action: PayloadAction<{ postId: string; isLiked: boolean }>) => {
      const { postId, isLiked } = action.payload;
      const postIndex = state.posts.findIndex(post => post.id === postId);
      if (postIndex !== -1) {
        const post = state.posts[postIndex];
        state.posts[postIndex] = {
          ...post,
          likesCount: isLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1),
          isLikedByUser: isLiked,
        };
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = { ...action.payload, lastUpdated: Date.now() };
        state.error = null;
        state.lastProfileFetch = Date.now();
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch user posts
      .addCase(fetchUserPosts.pending, (state) => {
        state.postsLoading = true;
        state.error = null;
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.postsLoading = false;
        console.log('Storing posts in state:', action.payload.length, 'posts');
        state.posts = action.payload;
        state.lastPostsFetch = Date.now();
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.postsLoading = false;
        const errorMessage = action.payload as string;

        // Don't set error for index-related issues, "already loading", or "too soon"
        if (!errorMessage.includes('Index not ready') && 
            !errorMessage.includes('Already loading') && 
            !errorMessage.includes('Too soon')) {
          state.error = errorMessage;
        }
      });
  },
});

export const {
  updateProfile,
  clearUserData,
  addPost,
  updatePost,
  removePost,
  updatePostLike,
  setError,
} = userSlice.actions;

export default userSlice.reducer;