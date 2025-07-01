import { Alert } from 'react-native';
import {
  doc,
  updateDoc,
  deleteDoc,
  increment,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
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

export const loadComments = async (postId: string, currentUserId?: string): Promise<Comment[]> => {
  try {
    const firestore = getFirestore();
    const commentsCollection = collection(firestore, 'posts', postId, 'comments');
    const commentsQuery = query(commentsCollection, orderBy('createdAt', 'asc'));
    const commentsSnapshot = await getDocs(commentsQuery);

    const comments: Comment[] = [];

    for (const commentDoc of commentsSnapshot.docs) {
      const data = commentDoc.data();

      // Check if current user liked this comment
      let isLikedByUser = false;
      if (currentUserId) {
        const userLikeQuery = query(
          collection(firestore, 'posts', postId, 'comments', commentDoc.id, 'likes'),
          where('authorId', '==', currentUserId),
          limit(1)
        );
        const userLikeSnapshot = await getDocs(userLikeQuery);
        isLikedByUser = !userLikeSnapshot.empty;
      }

      const comment: Comment = {
        id: commentDoc.id,
        authorId: data.authorId,
        authorName: data.authorName,
        authorPhotoURL: data.authorPhotoURL || '',
        content: data.content,
        createdAt: data.createdAt?.toDate() || new Date(),
        likesCount: data.likesCount || 0,
        repliesCount: data.repliesCount || 0,
        isLikedByUser,
      };

      comments.push(comment);

      // Fetch replies for this comment
      const repliesCollection = collection(firestore, 'posts', postId, 'comments', commentDoc.id, 'replies');
      const repliesQuery = query(repliesCollection, orderBy('createdAt', 'asc'));
      const repliesSnapshot = await getDocs(repliesQuery);

      for (const replyDoc of repliesSnapshot.docs) {
        const replyData = replyDoc.data();

        // Check if current user liked this reply
        let isReplyLikedByUser = false;
        if (currentUserId) {
          const userReplyLikeQuery = query(
            collection(firestore, 'posts', postId, 'comments', commentDoc.id, 'replies', replyDoc.id, 'likes'),
            where('authorId', '==', currentUserId),
            limit(1)
          );
          const userReplyLikeSnapshot = await getDocs(userReplyLikeQuery);
          isReplyLikedByUser = !userReplyLikeSnapshot.empty;
        }

        const reply: Comment = {
          id: replyDoc.id,
          authorId: replyData.authorId,
          authorName: replyData.authorName,
          authorPhotoURL: replyData.authorPhotoURL || '',
          content: replyData.content,
          createdAt: replyData.createdAt?.toDate() || new Date(),
          likesCount: replyData.likesCount || 0,
          repliesCount: 0,
          parentCommentId: commentDoc.id,
          isLikedByUser: isReplyLikedByUser,
        };

        comments.push(reply);
      }
    }

    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
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
  post: Post | null,
  parentCommentId?: string
) => {
  if (!commentText.trim() || !currentUser || !post?.allowComments) return;

  try {
    const firestore = getFirestore();

    // Get current user info
    const currentUserDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
    const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : {};
    const currentUserName = currentUserData.firstName && currentUserData.lastName 
      ? `${currentUserData.firstName} ${currentUserData.lastName}` 
      : 'Someone';

    if (parentCommentId) {
      // This is a reply - store it in the replies subcollection
      const repliesCollection = collection(firestore, 'posts', postId, 'comments', parentCommentId, 'replies');

      await addDoc(repliesCollection, {
        authorId: currentUser.uid,
        authorName: currentUserName,
        authorPhotoURL: currentUserData.photoURL || '',
        content: commentText.trim(),
        createdAt: serverTimestamp(),
        parentCommentId: parentCommentId,
        likesCount: 0,
        repliesCount: 0,
      });

      // Update parent comment's reply count
      const parentCommentRef = doc(firestore, 'posts', postId, 'comments', parentCommentId);
      const parentCommentDoc = await getDoc(parentCommentRef);
      if (parentCommentDoc.exists()) {
        await updateDoc(parentCommentRef, {
          repliesCount: (parentCommentDoc.data().repliesCount || 0) + 1,
        });
      }
    } else {
      // This is a top-level comment
      const commentsCollection = collection(firestore, 'posts', postId, 'comments');

      await addDoc(commentsCollection, {
        authorId: currentUser.uid,
        authorName: currentUserName,
        authorPhotoURL: currentUserData.photoURL || '',
        content: commentText.trim(),
        createdAt: serverTimestamp(),
        parentCommentId: null,
        likesCount: 0,
        repliesCount: 0,
      });
    }

    // Update post's total comments count
    const postRef = doc(firestore, 'posts', postId);
    const postDoc = await getDoc(postRef);
    if (postDoc.exists()) {
      await updateDoc(postRef, {
        commentsCount: (postDoc.data().commentsCount || 0) + 1,
      });
    }

    // Create notification for the post author if it's not the current user
    if (post && post.authorId !== currentUser.uid) {
      // Create notification
      await addDoc(collection(firestore, 'notifications'), {
        type: parentCommentId ? 'reply' : 'comment',
        title: parentCommentId ? 'New Reply' : 'New Comment',
        body: parentCommentId ? `${currentUserName} replied to your comment` : `${currentUserName} commented on your post`,
        postId: postId,
        parentCommentId: parentCommentId || null,
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

    // Delete all comments
    const commentsRef = collection(firestore, 'posts', postId, 'comments');
    const commentsQuery = query(commentsRef);
    const commentsSnapshot = await getDocs(commentsQuery);
    
    for (const commentDoc of commentsSnapshot.docs) {
      // Delete all likes for the comment
      const likesRef = collection(firestore, 'posts', postId, 'comments', commentDoc.id, 'likes');
      const likesQuery = query(likesRef);
      const likesSnapshot = await getDocs(likesQuery);
      for (const likeDoc of likesSnapshot.docs) {
        await deleteDoc(likeDoc.ref);
      }

      // Delete all replies for the comment
      const repliesRef = collection(firestore, 'posts', postId, 'comments', commentDoc.id, 'replies');
      const repliesQuery = query(repliesRef);
      const repliesSnapshot = await getDocs(repliesQuery);
      for (const replyDoc of repliesSnapshot.docs) {
        // Delete all likes for the reply
        const replyLikesRef = collection(firestore, 'posts', postId, 'comments', commentDoc.id, 'replies', replyDoc.id, 'likes');
        const replyLikesQuery = query(replyLikesRef);
        const replyLikesSnapshot = await getDocs(replyLikesQuery);
        for (const replyLikeDoc of replyLikesSnapshot.docs) {
          await deleteDoc(replyLikeDoc.ref);
        }

        await deleteDoc(replyDoc.ref);
      }

      await deleteDoc(commentDoc.ref);
    }

    // Delete all likes for the post
    const postLikesRef = collection(firestore, 'posts', postId, 'likes');
    const postLikesQuery = query(postLikesRef);
    const postLikesSnapshot = await getDocs(postLikesQuery);
    for (const likeDoc of postLikesSnapshot.docs) {
      await deleteDoc(likeDoc.ref);
    }

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

// Helper function to count total comments that will be deleted (including replies)
export const countCommentsToDelete = async (
  postId: string,
  commentId: string,
  parentCommentId?: string
): Promise<number> => {
  try {
    const firestore = getFirestore();

    if (parentCommentId) {
      // This is a reply, so only 1 comment will be deleted
      return 1;
    } else {
      // This is a top-level comment, count it + all its replies
      let totalCount = 1; // The comment itself

      const repliesQuery = query(
        collection(firestore, 'posts', postId, 'comments', commentId, 'replies')
      );
      const repliesSnapshot = await getDocs(repliesQuery);
      totalCount += repliesSnapshot.size;

      return totalCount;
    }
  } catch (error) {
    console.error('Error counting comments to delete:', error);
    return 1; // Fallback to just the main comment
  }
};

export const deleteComment = async (
  postId: string,
  commentId: string,
  parentCommentId?: string
) => {
  try {
    const firestore = getFirestore();

    // Count how many comments will be deleted before actually deleting
    const totalCommentsToDelete = await countCommentsToDelete(postId, commentId, parentCommentId);

    if (parentCommentId) {
      // This is a reply - delete from replies subcollection
      const replyRef = doc(firestore, 'posts', postId, 'comments', parentCommentId, 'replies', commentId);
      await deleteDoc(replyRef);

      // Update parent comment's replies count
      const parentCommentRef = doc(firestore, 'posts', postId, 'comments', parentCommentId);
      await updateDoc(parentCommentRef, {
        repliesCount: increment(-1)
      });
    } else {
      // This is a top-level comment - delete from comments collection
      const commentRef = doc(firestore, 'posts', postId, 'comments', commentId);
      await deleteDoc(commentRef);
    }

    // Update post's total comments count by the actual number of comments deleted
    const postRef = doc(firestore, 'posts', postId);
    await updateDoc(postRef, {
      commentsCount: increment(-totalCommentsToDelete)
    });
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

    if (parentCommentId) {
      // This is a reply - store it in the replies subcollection
      const repliesCollection = collection(firestore, 'posts', postId, 'comments', parentCommentId, 'replies');

      await addDoc(repliesCollection, {
        authorId: userId,
        authorName: userName,
        authorPhotoURL: userPhotoURL || '',
        content: content.trim(),
        createdAt: serverTimestamp(),
        parentCommentId: parentCommentId,
        likesCount: 0,
        repliesCount: 0,
      });

      // Update parent comment's reply count
      const parentCommentRef = doc(firestore, 'posts', postId, 'comments', parentCommentId);
      const parentCommentDoc = await getDoc(parentCommentRef);
      if (parentCommentDoc.exists()) {
        await updateDoc(parentCommentRef, {
          repliesCount: (parentCommentDoc.data().repliesCount || 0) + 1,
        });
      }
    } else {
      // This is a top-level comment
      const commentsCollection = collection(firestore, 'posts', postId, 'comments');

      await addDoc(commentsCollection, {
        authorId: userId,
        authorName: userName,
        authorPhotoURL: userPhotoURL || '',
        content: content.trim(),
        createdAt: serverTimestamp(),
        parentCommentId: null,
        likesCount: 0,
        repliesCount: 0,
      });
    }

    // Update post's total comments count
    const postRef = doc(firestore, 'posts', postId);
    const postDoc = await getDoc(postRef);
    if (postDoc.exists()) {
      await updateDoc(postRef, {
        commentsCount: (postDoc.data().commentsCount || 0) + 1,
      });
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
  t: TFunction,
  parentCommentId?: string
): Promise<void> => {
  try {
    const firestore = getFirestore();

    let commentLikesCollection;
    let commentRef;

    if (parentCommentId) {
      // This is a reply
      commentLikesCollection = collection(firestore, 'posts', postId, 'comments', parentCommentId, 'replies', commentId, 'likes');
      commentRef = doc(firestore, 'posts', postId, 'comments', parentCommentId, 'replies', commentId);
    } else {
      // This is a top-level comment
      commentLikesCollection = collection(firestore, 'posts', postId, 'comments', commentId, 'likes');
      commentRef = doc(firestore, 'posts', postId, 'comments', commentId);
    }

    // Check if user already liked
    const userLikeQuery = query(
      commentLikesCollection,
      where('authorId', '==', userId),
      limit(1)
    );

    const userLikesSnapshot = await getDocs(userLikeQuery);

    if (!userLikesSnapshot.empty) {
      // Delete the user's like
      await deleteDoc(userLikesSnapshot.docs[0].ref);

      // Update comment's like count
      const commentDoc = await getDoc(commentRef);
      if (commentDoc.exists()) {
        await updateDoc(commentRef, {
          likesCount: Math.max(0, (commentDoc.data().likesCount || 0) - 1),
        });
      }
    } else {
      // Add like
      await addDoc(commentLikesCollection, {
        authorId: userId,
        createdAt: serverTimestamp(),
      });

      // Update likes count
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

      // Check if current user liked this comment
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