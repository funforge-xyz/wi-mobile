import { Alert } from 'react-native';
import { getFirestore } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storageService } from '../services/storage';
import { authService } from '../services/auth';

export interface PostData {
  content: string;
  mediaURL: string;
  allowComments: boolean;
  showLikeCount: boolean;
}

export const createPost = async (
  postData: PostData,
  t: (key: string, fallback?: string) => string
): Promise<string> => {
  try {
    // Get current user
    const { getAuth } = await import('../services/firebase');
    const auth = getAuth();
    const currentUser = auth.currentUser || await authService.getCurrentUser();

    if (!currentUser) {
      throw new Error(t('addPost.loginRequired', 'You must be logged in to create a post'));
    }

    let mediaURL = '';

    // Upload image if selected
    if (postData.mediaURL) {
      try {
        mediaURL = await storageService.uploadPostImage(currentUser.uid, postData.mediaURL);
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        throw new Error(t('addPost.uploadFailed', 'Failed to upload image'));
      }
    }

    // Create post in Firestore
    const firestore = getFirestore();
    const postsCollection = collection(firestore, 'posts');

    const newPostDoc = await addDoc(postsCollection, {
      authorId: currentUser.uid,
      content: postData.content.trim(),
      mediaURL: mediaURL || null,
      thumbURL: mediaURL || null,
      allowComments: postData.allowComments,
      showLikeCount: postData.showLikeCount,
      createdAt: serverTimestamp(),
    });

    return newPostDoc.id;
  } catch (error) {
    console.error('Post creation error:', error);
    throw error;
  }
};

export const showDiscardAlert = (
  hasContent: boolean,
  onDiscard: () => void,
  t: (key: string, fallback?: string) => string
) => {
  if (hasContent) {
    Alert.alert(
      t('addPost.discardPost', 'Discard Post'),
      t('addPost.discardPostMessage', 'Are you sure you want to discard this post?'),
      [
        {
          text: t('addPost.keepEditing', 'Keep Editing'),
          style: 'cancel',
        },
        {
          text: t('addPost.discard', 'Discard'),
          style: 'destructive',
          onPress: onDiscard,
        },
      ]
    );
  } else {
    onDiscard();
  }
};