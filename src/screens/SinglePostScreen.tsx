import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import { 
  onSnapshot,
  query, 
  orderBy, 
  collection,
} from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import { authService } from '../services/auth';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTranslation } from 'react-i18next';
import SinglePostHeader from '../components/SinglePostHeader';
import SinglePostDisplay from '../components/SinglePostDisplay';
import CommentsList from '../components/CommentsList';
import CommentInput from '../components/CommentInput';
import EditPostModal from '../components/EditPostModal';
import SinglePostSkeleton from '../components/SinglePostSkeleton';
import DeletePostConfirmationModal from '../components/DeletePostConfirmationModal';
import SuccessModal from '../components/SuccessModal';
import { createSinglePostStyles } from '../styles/SinglePostStyles';
import { getTheme } from '../theme';
import {
  updatePost,
  deletePost,
  showDeleteCommentAlert,
  toggleCommentLike,
  deleteComment,
} from '../utils/singlePostUtils';
import { useAppDispatch } from '../hooks/redux';
import {
  loadPost,
  loadComments,
  loadLikes,
  handleLike,
  handleComment,
} from '../utils/singlePostUtils';
import { Animated } from 'react-native';

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
}

interface Like {
  id: string;
  authorId: string;
  authorName: string;
}

export default function SinglePostScreen({ route, navigation }: any) {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const dispatch = useAppDispatch();

  const { postId, isOwnPost = false } = route.params;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedPrivacy, setEditedPrivacy] = useState(false);
  const [editedAllowComments, setEditedAllowComments] = useState(true);
  const [editedShowLikeCount, setEditedShowLikeCount] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditSuccessModal, setShowEditSuccessModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [editSuccessAnimation] = useState(new Animated.Value(0));
  const [deleteSuccessAnimation] = useState(new Animated.Value(0));
  const [replyToComment, setReplyToComment] = useState<{
    id: string;
    authorName: string;
  } | null>(null);

  const { t } = useTranslation();

  const currentTheme = getTheme(isDarkMode);
  const singlePostStyles = createSinglePostStyles(isDarkMode);

  useEffect(() => {
    loadPostData();
    loadCurrentUser();

    // Set up real-time listeners
    const firestore = getFirestore();

    // Listen to comments
    const commentsQuery = query(
      collection(firestore, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      loadCommentsData();
    });

    // Listen to likes
    const likesQuery = query(collection(firestore, 'posts', postId, 'likes'));
    const unsubscribeLikes = onSnapshot(likesQuery, (snapshot) => {
      loadLikesData();
    });

    return () => {
      unsubscribeComments();
      unsubscribeLikes();
    };
  }, [postId]);

  const loadCurrentUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadPostData = async () => {
    try {
      const postData = await loadPost(postId);

      if (postData) {
        setEditedContent(postData.content);
        setEditedPrivacy(postData.isPrivate || false);
        setEditedAllowComments(postData.allowComments);
        setEditedShowLikeCount(postData.showLikeCount);
        setPost(postData);
        await loadCommentsData();
        await loadLikesData();
      } else {
        Alert.alert(t('common.error'), t('singlePost.postNotFound'));
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert(t('common.error'), t('singlePost.failedToLoadPost'));
    } finally {
      setLoading(false);
    }
  };

  const loadCommentsData = async () => {
    try {
      const commentsData = await loadComments(postId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadLikesData = async () => {
    try {
      const likesData = await loadLikes(postId);
      setLikes(likesData);
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const handleLikePress = async () => {
    try {
      await handleLike(postId, likes, currentUser);
    } catch (error) {
      Alert.alert(t('common.error'), t('singlePost.failedToUpdateLike'));
    }
  };

  const handleCommentSubmit = async () => {
    try {
      setSubmittingComment(true);
      await handleComment(postId, commentText, currentUser, post, replyToComment?.id);
      setCommentText('');
      setReplyToComment(null);
      await loadCommentsData(); // Reload comments to show the new reply
    } catch (error) {
      Alert.alert(t('common.error'), t('singlePost.failedToAddComment'));
    } finally {
      setSubmittingComment(false);
    }
  };

    const handleReplyToComment = (commentId: string, authorName: string) => {
    setReplyToComment({ id: commentId, authorName });
  };

  const handleCancelReply = () => {
    setReplyToComment(null);
  };

  const handleLikeComment = async (commentId: string, parentCommentId: string | undefined, isCurrentlyLiked: boolean, t: any) => {
    if (!currentUser || !post) return;

    try {
      await toggleCommentLike(
        post.id,
        commentId,
        currentUser.uid,
        isCurrentlyLiked,
        t,
        parentCommentId
      );
      await loadCommentsData();
    } catch (error) {
      console.error('Error liking comment:', error);
      Alert.alert(t('common.error'), t('singlePost.failedToLikeComment'));
    }
  };

  const handleShowReplies = (commentId: string) => {
    // This could expand/collapse replies or navigate to a detailed view
    // For now, all replies are shown inline
  };

  const handleEditPost = () => {
    if (post) {
      setEditedContent(post.content || '');
      setEditedPrivacy(post.isPrivate || false);
      setEditedAllowComments(post.allowComments);
      setEditedShowLikeCount(post.showLikeCount);
    }
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!currentUser || !post) return;

    try {
      await updatePost(
        postId,
        editedContent,
        editedPrivacy,
        editedAllowComments,
        editedShowLikeCount,
        dispatch
      );

      // Update local state
      setPost({
        ...post,
        content: editedContent.trim(),
        isPrivate: editedPrivacy,
        allowComments: editedAllowComments,
        showLikeCount: editedShowLikeCount,
      });

      setIsEditing(false);

      // Show success modal
      setShowEditSuccessModal(true);
      Animated.timing(editSuccessAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-hide after 2 seconds
      setTimeout(() => {
        Animated.timing(editSuccessAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowEditSuccessModal(false);
        });
      }, 2000);
    } catch (error) {
      Alert.alert(t('common.error'), t('singlePost.failedToUpdate'));
    }
  };

  const handleDeletePost = () => {
    setIsEditing(false); // Close edit modal first
    setShowDeleteModal(true);
  };

  const confirmDeletePost = async () => {
    setShowDeleteModal(false);
    try {
      await deletePost(postId, dispatch);

      // Show success modal
      setShowDeleteSuccessModal(true);
      Animated.timing(deleteSuccessAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-hide after 2 seconds then navigate back
      setTimeout(() => {
        Animated.timing(deleteSuccessAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowDeleteSuccessModal(false);
          navigation.goBack();
        });
      }, 2000);
    } catch (error) {
      Alert.alert(t('common.error'), t('singlePost.failedToDelete'));
    }
  };

  const handleDeleteComment = async (commentId: string, commentAuthorId: string, parentCommentId?: string) => {
    if (!currentUser || (commentAuthorId !== currentUser.uid && post?.authorId !== currentUser.uid)) {
      Alert.alert(t('error.title'), t('error.unauthorized'));
      return;
    }

    showDeleteCommentAlert(async () => {
      try {
        setLoading(true);
        await deleteComment(post!.id, commentId, parentCommentId);
        await loadCommentsData(); // Reload comments
      } catch (error) {
        console.error('Error deleting comment:', error);
        Alert.alert(t('error.title'), t('error.deleteCommentFailed'));
      } finally {
        setLoading(false);
      }
    }, t);
  };

  if (loading) {
    return (
      <SafeAreaView style={[singlePostStyles.container, { backgroundColor: currentTheme.background }]}>
        <SinglePostSkeleton />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={[singlePostStyles.container, { backgroundColor: currentTheme.background }]}>
        <View style={singlePostStyles.errorContainer}>
          <Text style={[singlePostStyles.errorText, { color: currentTheme.text }]}>
            {t('singlePost.postNotFound')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const userLiked = likes.some(like => like.authorId === currentUser?.uid);

  return (
    <SafeAreaView style={[singlePostStyles.container, { backgroundColor: currentTheme.background }]}>
      <SinglePostHeader
        onBack={() => navigation.goBack()}
        onEdit={handleEditPost}
        canEdit={isOwnPost && post?.authorId === currentUser?.uid}
        currentTheme={currentTheme}
      />

      <KeyboardAwareScrollView style={singlePostStyles.content}>
        <SinglePostDisplay
          post={post}
          liked={userLiked}
          likesCount={likes.length}
          commentsCount={comments.length}
          onLikePress={handleLikePress}
          onCommentPress={() => {}}
          currentTheme={currentTheme}
        />

        <CommentsList
          comments={comments}
          allowComments={post.allowComments}
          currentUserId={currentUser?.uid}
          postAuthorId={post.authorId}
          onDeleteComment={handleDeleteComment}
          onLikeComment={handleLikeComment}
          onReplyToComment={handleReplyToComment}
          onShowReplies={handleShowReplies}
          currentTheme={currentTheme}
        />
      </KeyboardAwareScrollView>

      {/* Comment Input */}
      {post.allowComments && currentUser && (
        <CommentInput
          value={commentText}
          onChangeText={setCommentText}
          onSubmit={handleCommentSubmit}
          isSubmitting={submittingComment}
          currentTheme={currentTheme}
          replyToComment={replyToComment}
          onCancelReply={handleCancelReply}
        />
      )}

      {/* Edit Post Modal */}
      <EditPostModal
        visible={isEditing}
        content={editedContent}
        isPrivate={editedPrivacy}
        allowComments={editedAllowComments}
        showLikeCount={editedShowLikeCount}
        onContentChange={setEditedContent}
        onPrivacyChange={setEditedPrivacy}
        onAllowCommentsChange={setEditedAllowComments}
        onShowLikeCountChange={setEditedShowLikeCount}
        onSave={handleSaveEdit}
        onCancel={() => setIsEditing(false)}
        onDelete={handleDeletePost}
        currentTheme={currentTheme}
      />

      {/* Delete Post Confirmation Modal */}
      <DeletePostConfirmationModal
        visible={showDeleteModal}
        onConfirm={confirmDeletePost}
        onCancel={() => setShowDeleteModal(false)}
        currentTheme={currentTheme}
      />

      {/* Edit Success Modal */}
      <SuccessModal
        visible={showEditSuccessModal}
        title={t('singlePost.success')}
        message={t('singlePost.postUpdated')}
        animation={editSuccessAnimation}
        currentTheme={currentTheme}
      />

      {/* Delete Success Modal */}
      <SuccessModal
        visible={showDeleteSuccessModal}
        title={t('singlePost.success')}
        message={t('singlePost.postDeleted')}
        animation={deleteSuccessAnimation}
        currentTheme={currentTheme}
      />
    </SafeAreaView>
  );
}