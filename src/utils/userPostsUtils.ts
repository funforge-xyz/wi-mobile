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
  updatePostLike: (data: any) => void
) => {
  try {
    const { getFirestore, getAuth } = await import('../services/firebase');
    const { doc, collection, addDoc, deleteDoc, getDocs, query, where } = await import('firebase/firestore');

    const firestore = getFirestore();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const likesRef = collection(firestore, 'posts', postId, 'likes');
    const userLikeQuery = query(likesRef, where('authorId', '==', currentUser.uid));
    const userLikeSnapshot = await getDocs(userLikeQuery);

    if (userLikeSnapshot.empty) {
      // Add like
      await addDoc(likesRef, {
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        createdAt: new Date(),
      });

      updatePostLike({
        postId,
        isLikedByUser: true,
        likesCount: post.likesCount + 1,
      });
    } else {
      // Remove like
      const likeDoc = userLikeSnapshot.docs[0];
      await deleteDoc(likeDoc.ref);

      updatePostLike({
        postId,
        isLikedByUser: false,
        likesCount: Math.max(0, post.likesCount - 1),
      });
    }
  } catch (error) {
    console.error('Error handling like:', error);
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