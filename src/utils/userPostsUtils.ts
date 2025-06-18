
import { Alert } from 'react-native';
import { collection, getDocs, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';

export const formatTimeAgo = (dateInput: string | Date, t: (key: string, options?: any) => string) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 6) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } else if (diffInDays > 0) {
    return t('time.daysAgo', { count: diffInDays });
  } else if (diffInHours > 0) {
    return t('time.hoursAgo', { count: diffInHours });
  } else if (diffInMinutes > 0) {
    return t('time.minutesAgo', { count: diffInMinutes });
  } else {
    return t('time.justNow');
  }
};

export const handlePostLike = async (
  postId: string, 
  posts: any[], 
  updatePostLike: (data: { postId: string; isLiked: boolean }) => void
) => {
  try {
    const { getAuth } = await import('../services/firebase');
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to like posts');
      return;
    }

    const firestore = getFirestore();
    const likesCollection = collection(firestore, 'posts', postId, 'likes');

    // Check if user already liked this post
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.isLikedByUser) {
      // Unlike: Find and delete the user's like
      const likesSnapshot = await getDocs(likesCollection);
      let userLikeDoc: any = null;

      likesSnapshot.forEach((likeDoc) => {
        if (likeDoc.data().authorId === currentUser.uid) {
          userLikeDoc = likeDoc;
        }
      });

      if (userLikeDoc) {
        await deleteDoc(doc(firestore, 'posts', postId, 'likes', userLikeDoc.id));
      }

      // Update Redux state
      updatePostLike({ postId, isLiked: false });
    } else {
      // Like: Add new like
      await addDoc(likesCollection, {
        authorId: currentUser.uid,
        createdAt: new Date(),
      });

      // Update Redux state
      updatePostLike({ postId, isLiked: true });
    }
  } catch (error) {
    console.error('Error handling like:', error);
    Alert.alert('Error', 'Failed to update like');
  }
};

export const loadUserPostsData = async (dispatch: any, currentUser: any, fetchUserProfile?: any, fetchUserPosts?: any) => {
  try {
    if (currentUser) {
      console.log('Loading posts for user:', currentUser.uid);
      const { fetchUserProfile, fetchUserPosts } = await import('../store/userSlice');
      const profileResult = await dispatch(fetchUserProfile(currentUser.uid));
      const postsResult = await dispatch(fetchUserPosts(currentUser.uid));
      
      console.log('Profile result:', profileResult);
      console.log('Posts result:', postsResult);
    }
  } catch (error) {
    console.error('Error loading initial data:', error);
  }
};

export const refreshUserPostsData = async (dispatch: any, currentUser: any) => {
  if (currentUser) {
    const { fetchUserProfile, fetchUserPosts } = await import('../store/userSlice');
    await Promise.all([
      dispatch(fetchUserProfile(currentUser.uid)).unwrap(),
      dispatch(fetchUserPosts(currentUser.uid)).unwrap()
    ]);
  }
};
