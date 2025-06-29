import { Alert } from 'react-native';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  query, 
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import { TFunction } from 'react-i18next';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  mediaURL?: string;
  mediaType?: 'image' | 'video';
  createdAt: Date;
  showLikeCount: boolean;
  allowComments: boolean;
  isPrivate?: boolean;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  createdAt: Date;
  likesCount: number;
  repliesCount: number;
  parentCommentId?: string;
  isLikedByUser?: boolean;
}

interface Like {
  id: string;
  authorId: string;
  authorName: string;
}

export const loadPost = async (postId: string): Promise<Post | null> => {
  try {
    const firestore = getFirestore();
    const postDoc = await getDoc(doc(firestore, 'posts', postId));

    if (postDoc.exists()) {
      const postData = postDoc.data();

      // Get author information
      const authorDoc = await getDoc(doc(firestore, 'users', postData.authorId));
      const authorData = authorDoc.exists() ? authorDoc.data() : {};

      return {
        id: postDoc.id,
        authorId: postData.authorId,
        authorName: authorData.firstName && authorData.lastName 
          ? `${authorData.firstName} ${authorData.lastName}` 
          : 'Anonymous User',
        authorPhotoURL: authorData.photoURL || '',
        content: postData.content || '',
        mediaURL: postData.mediaURL || '',
        mediaType: postData.mediaType || 'image',
        createdAt: postData.createdAt?.toDate() || new Date(),
        showLikeCount: postData.showLikeCount !== false,
        allowComments: postData.allowComments !== false,
        isPrivate: postData.isPrivate || false,
      };
    }
    return null;
  } catch (error) {
    console.error('Error loading post:', error);
    throw error;
  }
};

export const loadComments = async (postId: string): Promise<Comment[]> => {
  try {
    const firestore = getFirestore();
    const commentsQuery = query(
      collection(firestore, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const commentsSnapshot = await getDocs(commentsQuery);

    const commentsList: Comment[] = [];

    for (const commentDoc of commentsSnapshot.docs) {
      const commentData = commentDoc.data();

      // Get author information
      const authorDoc = await getDoc(doc(firestore, 'users', commentData.authorId));
      const authorData = authorDoc.exists() ? authorDoc.data() : {};

      commentsList.push({
        id: commentDoc.id,
        authorId: commentData.authorId,
        authorName: authorData.firstName && authorData.lastName 
          ? `${authorData.firstName} ${authorData.lastName}` 
          : 'Anonymous User',
        authorPhotoURL: authorData.photoURL || '',
        content: commentData.content || '',
        createdAt: commentData.createdAt?.toDate() || new Date(),
        likesCount: commentData.likesCount || 0,
        repliesCount: commentData.repliesCount || 0,
        parentCommentId: commentData.parentCommentId || undefined,
      });
    }

    return commentsList;
  } catch (error) {
    console.error('Error loading comments:', error);
    throw error;
  }
};

export const loadLikes = async (postId: string): Promise<Like[]> => {
  try {
    const firestore = getFirestore();
    const likesSnapshot = await getDocs(collection(firestore, 'posts', postId, 'likes'));

    const likesList: Like[] = [];

    for (const likeDoc of likesSnapshot.docs) {
      const likeData = likeDoc.data();

      // Get author information
      const authorDoc = await getDoc(doc(firestore, 'users', likeData.authorId));
      const authorData = authorDoc.exists() ? authorDoc.data() : {};

      likesList.push({
        id: likeDoc.id,
        authorId: likeData.authorId,
        authorName: authorData.firstName && authorData.lastName 
          ? `${authorData.firstName} ${authorData.lastName}` 
          : 'Anonymous User',
      });
    }

    return likesList;
  } catch (error) {
    console.error('Error loading likes:', error);
    throw error;
  }
};

export const handleLike = async (postId: string, likes: Like[], currentUser: any) => {
  if (!currentUser) return;

  try {
    const firestore = getFirestore();
    const likesCollection = collection(firestore, 'posts', postId, 'likes');

    // Check if user already liked
    const userLike = likes.find(like => like.authorId === currentUser.uid);

    if (userLike) {
      // Unlike
      await deleteDoc(doc(firestore, 'posts', postId, 'likes', userLike.id));
    } else {
      // Like
      await addDoc(likesCollection, {
        authorId: currentUser.uid,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error handling like:', error);
    throw error;
  }
};

export const handleComment = async (
  postId: string, 
  commentText: string, 
  currentUser: any, 
  post: Post | null
) => {
  if (!commentText.trim() || !currentUser || !post?.allowComments) return;

  try {
    const firestore = getFirestore();
    const commentsCollection = collection(firestore, 'posts', postId, 'comments');

    await addDoc(commentsCollection, {
      authorId: currentUser.uid,
      content: commentText.trim(),
      createdAt: serverTimestamp(),
    });

    // Create notification for the post author if it's not the current user
    if (post && post.authorId !== currentUser.uid) {
      // Get current user info
      const currentUserDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
      const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : {};
      const currentUserName = currentUserData.firstName && currentUserData.lastName 
        ? `${currentUserData.firstName} ${currentUserData.lastName}` 
        : 'Someone';

      // Create notification
      await addDoc(collection(firestore, 'notifications'), {
        type: 'comment',
        title: 'New Comment',
        body: `${currentUserName} commented on your post`,
        postId: postId,
        targetUserId: post.authorId,
        fromUserId: currentUser.uid,
        fromUserName: currentUserName,
        fromUserPhotoURL: currentUserData.photoURL || '',
        createdAt: serverTimestamp(),
        read: false,
      });
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const updatePost = async (
  postId: string,
  content: string,
  isPrivate: boolean,
  allowComments: boolean,
  showLikeCount: boolean,
  dispatch?: any
) => {
  try {
    const firestore = getFirestore();
    const postRef = doc(firestore, 'posts', postId);

    const updates = {
      content: content.trim(),
      isPrivate: isPrivate,
      allowComments: allowComments,
      showLikeCount: showLikeCount,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(postRef, updates);

    // Update Redux state
    if (dispatch) {
      const { updatePost } = await import('../store/userSlice');
      dispatch(updatePost({ 
        postId, 
        updates: {
          content: content.trim(),
          isPrivate,
          allowComments,
          showLikeCount
        }
      }));
    }
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

export const deletePost = async (postId: string, dispatch?: any) => {
  try {
    const firestore = getFirestore();
    const postRef = doc(firestore, 'posts', postId);
    await deleteDoc(postRef);

    // Update Redux state
    if (dispatch) {
      const { removePost } = await import('../store/userSlice');
      dispatch(removePost(postId));
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

export const deleteComment = async (postId: string, commentId: string) => {
  try {
    const firestore = getFirestore();
    const commentRef = doc(firestore, 'posts', postId, 'comments', commentId);
    await deleteDoc(commentRef);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

export const showDeletePostAlert = (onConfirm: () => void, t: TFunction) => {
  Alert.alert(
    t('singlePost.deletePost'),
    t('singlePost.deletePostConfirmation'),
    [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: onConfirm,
      }
    ]
  );
};

export const showDeleteCommentAlert = (onConfirm: () => void, t: TFunction) => {
  Alert.alert(
    t('singlePost.deleteComment'),
    t('singlePost.deleteCommentConfirmation'),
    [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: onConfirm,
      }
    ]
  );
};

export const addComment = async (
  postId: string,
  content: string,
  userId: string,
  userName: string,
  userPhotoURL: string,
  t: TFunction,
  parentCommentId?: string
): Promise<void> => {
  if (!content.trim()) {
    Alert.alert(t('error.title'), t('singlePost.commentCannotBeEmpty'));
    return;
  }

  try {
    const firestore = getFirestore();
    const commentsCollection = collection(firestore, 'posts', postId, 'comments');

    await addDoc(commentsCollection, {
      authorId: userId,
      authorName: userName,
      authorPhotoURL: userPhotoURL || '',
      content: content.trim(),
      createdAt: serverTimestamp(),
      parentCommentId: parentCommentId || null,
      likesCount: 0,
      repliesCount: 0,
    });

    // Update counts
    const postRef = doc(firestore, 'posts', postId);
    const postDoc = await getDoc(postRef);
    if (postDoc.exists()) {
      await updateDoc(postRef, {
        commentsCount: (postDoc.data().commentsCount || 0) + 1,
      });
    }

    // If it's a reply, update the parent comment's reply count
    if (parentCommentId) {
      const parentCommentRef = doc(firestore, 'posts', postId, 'comments', parentCommentId);
      const parentCommentDoc = await getDoc(parentCommentRef);
      if (parentCommentDoc.exists()) {
        await updateDoc(parentCommentRef, {
          repliesCount: (parentCommentDoc.data().repliesCount || 0) + 1,
        });
      }
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    Alert.alert(t('error.title'), t('error.addCommentFailed'));
    throw error;
  }
};

export const toggleCommentLike = async (
  postId: string,
  commentId: string,
  userId: string,
  isCurrentlyLiked: boolean,
  t: TFunction
): Promise<void> => {
  try {
    const firestore = getFirestore();
    const commentLikesCollection = collection(firestore, 'posts', postId, 'comments', commentId, 'likes');
    const commentRef = doc(firestore, 'posts', postId, 'comments', commentId);

    if (isCurrentlyLiked) {
      // Remove like
      const userLikeQuery = query(commentLikesCollection, orderBy('createdAt'));
      const userLikesSnapshot = await getDocs(userLikeQuery);

      let userLikeDoc = null;
      userLikesSnapshot.forEach((likeDoc) => {
        if (likeDoc.data().authorId === userId) {
          userLikeDoc = likeDoc;
        }
      });

      if (userLikeDoc) {
        await deleteDoc(userLikeDoc.ref);
      }

      // Update comment likes count
      const commentDoc = await getDoc(commentRef);
      if (commentDoc.exists()) {
        await updateDoc(commentRef, {
          likesCount: Math.max(0, (commentDoc.data().likesCount || 1) - 1),
        });
      }
    } else {
      // Add like
      await addDoc(commentLikesCollection, {
        authorId: userId,
        createdAt: serverTimestamp(),
      });

      // Update comment likes count
      const commentDoc = await getDoc(commentRef);
      if (commentDoc.exists()) {
        await updateDoc(commentRef, {
          likesCount: (commentDoc.data().likesCount || 0) + 1,
        });
      }
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
    Alert.alert(t('error.title'), t('error.likeCommentFailed'));
    throw error;
  }
};

export const fetchComments = async (postId: string, userId?: string): Promise<Comment[]> => {
  try {
    const firestore = getFirestore();
    const commentsCollection = collection(firestore, 'posts', postId, 'comments');
    const commentsQuery = query(commentsCollection, orderBy('createdAt', 'asc'));
    const commentsSnapshot = await getDocs(commentsQuery);

    const comments: Comment[] = [];

    for (const commentDoc of commentsSnapshot.docs) {
      const data = commentDoc.data();

      // Check if user liked this comment
      let isLikedByUser = false;
      if (userId) {
        const likesCollection = collection(firestore, 'posts', postId, 'comments', commentDoc.id, 'likes');
        const likesSnapshot = await getDocs(likesCollection);
        likesSnapshot.forEach((likeDoc) => {
          if (likeDoc.data().authorId === userId) {
            isLikedByUser = true;
          }
        });
      }

      comments.push({
        id: commentDoc.id,
        authorId: data.authorId,
        authorName: data.authorName,
        authorPhotoURL: data.authorPhotoURL,
        content: data.content,
        createdAt: data.createdAt?.toDate() || new Date(),
        likesCount: data.likesCount || 0,
        repliesCount: data.repliesCount || 0,
        parentCommentId: data.parentCommentId || undefined,
        isLikedByUser,
      });
    }

    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};