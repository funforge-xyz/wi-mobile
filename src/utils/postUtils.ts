import { Alert } from 'react-native';
import { getFirestore } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storageService } from '../services/storage';
import { authService } from '../services/auth';

export interface PostData {
  content: string;
  mediaURL: string;
  mediaType: 'image' | 'video';
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

    // Upload media if provided
    let downloadURL = '';
    let thumbURL = '';
    if (postData.mediaURL) {
      try {
        const uploadResult = await storageService.uploadPostMedia(
          currentUser.uid, 
          postData.mediaURL, 
          postData.mediaType || 'image'
        );
        downloadURL = uploadResult.mediaUrl;
        thumbURL = uploadResult.thumbnailUrl;
        console.log('Media uploaded successfully:', downloadURL);
        console.log('Thumbnail uploaded successfully:', thumbURL);
      } catch (uploadError) {
        console.error('Media upload failed:', uploadError);
        throw new Error(t('addPost.mediaUploadFailed', 'Failed to upload media'));
      }
    }

    // Create post in Firestore
    const firestore = getFirestore();
    const postsCollection = collection(firestore, 'posts');

    const newPostDoc = await addDoc(postsCollection, {
      authorId: currentUser.uid,
      content: postData.content.trim(),
      mediaURL: downloadURL || null,
      thumbURL: thumbURL || null,
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