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
import { createSinglePostStyles } from '../styles/SinglePostStyles';
import { getTheme } from '../theme';
import {
  loadPost,
  loadComments,
  loadLikes,
  handleLike,
  handleComment,
  updatePost,
  deletePost,
  deleteComment,
  showDeletePostAlert,
  showDeleteCommentAlert,
} from '../utils/singlePostUtils';

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
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

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
      await handleComment(postId, commentText, currentUser, post);
      setCommentText('');
    } catch (error) {
      Alert.alert(t('common.error'), t('singlePost.failedToAddComment'));
    } finally {
      setSubmittingComment(false);
    }
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
        editedShowLikeCount
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
      Alert.alert(t('singlePost.success'), t('singlePost.postUpdated'));
    } catch (error) {
      Alert.alert(t('common.error'), t('singlePost.failedToUpdate'));
    }
  };

  const handleDeletePost = () => {
    showDeletePostAlert(async () => {
      try {
        await deletePost(postId);
        Alert.alert(t('singlePost.success'), t('singlePost.postDeleted'));
        navigation.goBack();
      } catch (error) {
        Alert.alert(t('common.error'), t('singlePost.failedToDelete'));
      }
    }, t);
  };

  const handleDeleteComment = (commentId: string, commentAuthorId: string) => {
    // Only allow deletion if it's the user's own comment or their own post
    if (commentAuthorId !== currentUser?.uid && post?.authorId !== currentUser?.uid) {
      Alert.alert(t('common.error'), t('singlePost.canOnlyDeleteOwnComments'));
      return;
    }

    showDeleteCommentAlert(async () => {
      try {
        await deleteComment(postId, commentId);
      } catch (error) {
        Alert.alert(t('common.error'), t('singlePost.failedToDeleteComment'));
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
    </SafeAreaView>
  );
}