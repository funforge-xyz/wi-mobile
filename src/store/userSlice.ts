
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
  createdAt: Date;
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
          thumbnailURL: firestoreData.thumbnailURL || '',
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
      const firestore = getFirestore();
      
      // Get current user's profile data
      const userDocRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      let currentUserData: any = {};

      if (userDoc.exists()) {
        currentUserData = userDoc.data();
      }

      // Get user's posts
      const postsCollection = collection(firestore, 'posts');
      const userPostsQuery = query(
        postsCollection,
        where('authorId', '==', userId)
      );
      const postsSnapshot = await getDocs(userPostsQuery);

      const userPosts: UserPost[] = [];

      for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data();

        // Get likes count and check if user liked
        const likesCollection = collection(firestore, 'posts', postDoc.id, 'likes');
        const likesSnapshot = await getDocs(likesCollection);

        let isLikedByUser = false;
        likesSnapshot.forEach((likeDoc) => {
          if (likeDoc.data().authorId === userId) {
            isLikedByUser = true;
          }
        });

        // Get comments count
        const commentsCollection = collection(firestore, 'posts', postDoc.id, 'comments');
        const commentsSnapshot = await getDocs(commentsCollection);

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
          createdAt: postData.createdAt?.toDate() || new Date(),
          likesCount: likesSnapshot.size,
          commentsCount: commentsSnapshot.size,
          showLikeCount: postData.showLikeCount !== false,
          allowComments: postData.allowComments !== false,
          isPrivate: postData.isPrivate || false,
          isLikedByUser: isLikedByUser,
        });
      }

      return userPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      return rejectWithValue('Failed to fetch user posts');
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
        state.profile = action.payload;
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
        state.posts = action.payload;
        state.lastPostsFetch = Date.now();
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.postsLoading = false;
        state.error = action.payload as string;
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
