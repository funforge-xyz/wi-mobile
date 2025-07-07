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
  thumbnailURL?: string;
  mediaType?: 'image' | 'video';
  createdAt: string; // ISO string format for Redux serialization
  likesCount: number;
  commentsCount: number;
  showLikeCount: boolean;
  allowComments: boolean;
  isPrivate: boolean;
  isLikedByUser?: boolean;
  isFrontCamera?: boolean; // Added isFrontCamera to UserPost interface
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

      // Get user's profile, post count, and connections count in parallel
      const [userDoc, userPostsSnapshot, connectionsSnapshot] = await Promise.all([
        getDoc(userDocRef),
        getDocs(query(collection(firestore, 'posts'), where('authorId', '==', userId))),
        getDocs(
          query(
            collection(firestore, 'connections'),
            where('participants', 'array-contains', userId),
            where('status', '==', 'active')
          )
        ),
      ]);

      const postsCount = userPostsSnapshot.size;
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

// Helper for formatting Firestore date fields
const formatFirestoreDate = (date: any): string => {
  if (date?.toDate) return date.toDate().toISOString();
  if (date instanceof Date) return date.toISOString();
  return new Date().toISOString();
};

// Async thunk for fetching user posts
export const fetchUserPosts = createAsyncThunk(
  'user/fetchPosts',
  async (userId: string, { rejectWithValue }) => {
    try {
      console.log('Fetching posts for user:', userId);
      const firestore = getFirestore();

      // Get current user's profile data
      const userDocRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      let currentUserData: any = {};

      if (userDoc.exists()) {
        currentUserData = userDoc.data();
        console.log('User data found:', currentUserData);
      } else {
        console.log('No user document found for:', userId);
      }

      // Get user's posts
      const postsCollection = collection(firestore, 'posts');
      const userPostsQuery = query(
        postsCollection,
        where('authorId', '==', userId)
      );
      const postsSnapshot = await getDocs(userPostsQuery);

      console.log('Found', postsSnapshot.size, 'posts for user');

      const userPosts: UserPost[] = await Promise.all(
        postsSnapshot.docs.map(async (postDoc) => {
          const postData = postDoc.data();
          console.log('userSlice - Firebase user post data:', {
            id: postDoc.id,
            isFrontCamera: postData.isFrontCamera,
            mediaType: postData.mediaType,
            hasMediaURL: !!postData.mediaURL
          });
          return {
            id: postDoc.id,
            authorId: postData.authorId,
            authorName: postData.authorName || 'Anonymous',
            authorPhotoURL: postData.authorPhotoURL || '',
            content: postData.content || '',
            mediaURL: postData.mediaURL,
            thumbnailURL: postData.thumbnailURL,
            mediaType: postData.mediaType as 'image' | 'video' | undefined,
            isFrontCamera: postData.isFrontCamera,
            createdAt: formatFirestoreDate(postData.createdAt),
            likesCount: typeof postData.likesCount === 'number' ? postData.likesCount : 0,
            commentsCount: typeof postData.commentsCount === 'number' ? postData.commentsCount : 0,
            showLikeCount: postData.showLikeCount !== false,
            allowComments: postData.allowComments !== false,
            isPrivate: postData.isPrivate || false,
            isLikedByUser: false, // Will be updated separately
          };
        })
      );

      const sortedPosts = userPosts.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log('Returning', sortedPosts.length, 'sorted posts');
      return sortedPosts;
    } catch (error) {
      console.error('Error fetching user posts:', error);
      return rejectWithValue('Failed to fetch user posts');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (profileData: Partial<UserProfile>, { dispatch }) => {
    const updatedProfile = { ...profileData };
    dispatch(updateProfile(updatedProfile));
    return updatedProfile;
  }
);

export const loadUserLanguagePreference = createAsyncThunk(
  'user/loadLanguagePreference',
  async (userId: string, { dispatch }) => {
    try {
      const { getFirestore } = await import('../services/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      const { setLanguage } = await import('./languageSlice');

      const firestore = getFirestore();
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const preferredLanguage = userData.preferredLanguage;

        if (preferredLanguage) {
          // Update Redux language state
          dispatch(setLanguage(preferredLanguage));

          // Update i18n
          const { default: i18n } = await import('../i18n');
          await i18n.changeLanguage(preferredLanguage);

          // Update local storage via i18n (which handles AsyncStorage automatically)
          // The i18n.changeLanguage already stores to AsyncStorage via the language detector

          console.log('Loaded preferred language from Firebase:', preferredLanguage);
          return preferredLanguage;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to load language preference from Firebase:', error);
      return null;
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
    logout: (state) => {
      // Clear all user data on logout
      state.profile = null;
      state.posts = [];
      state.loading = false;
      state.postsLoading = false;
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
    updatePostLike: (state, action: PayloadAction<{ postId: string; isLikedByUser: boolean; likesCount: number }>) => {
      const { postId, isLikedByUser, likesCount } = action.payload;
      const postIndex = state.posts.findIndex(post => post.id === postId);
      if (postIndex !== -1) {
        state.posts[postIndex].isLikedByUser = isLikedByUser;
        state.posts[postIndex].likesCount = likesCount;
        // Don't update lastProfileFetch to prevent header refresh
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
        state.posts = Array.isArray(action.payload) ? action.payload : [];
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
  logout,
} = userSlice.actions;

export default userSlice.reducer;