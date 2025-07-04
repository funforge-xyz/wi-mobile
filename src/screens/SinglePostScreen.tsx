import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../config/constants';
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
import DeleteCommentConfirmationModal from '../components/DeleteCommentConfirmationModal';
import SuccessModal from '../components/SuccessModal';
import { createSinglePostStyles } from '../styles/SinglePostStyles';
import { getTheme } from '../theme';
import {
  updatePost,
  deletePost,
  toggleCommentLike,
  deleteComment,
} from '../utils/singlePostUtils';
import { useAppDispatch } from '../hooks/redux';
import { updatePost as updatePostInFeed } from '../store/feedSlice';
import { updatePostLike } from '../store/userSlice';
import {
  loadPost,
  loadComments,
  loadLikes,
  handleLike,
  handleComment,
} from '../utils/singlePostUtils';
import { Animated } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  mediaURL?: string;
  mediaType?: 'image' | 'video';
  thumbnailURL?: string;
  fileExtension?: string;
  postType: 'picture' | 'video' | 'text';
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
  const userPosts = useAppSelector((state) => state.user.posts);
  const dispatch = useAppDispatch();

  // Validate route params to prevent undefined errors
  const { postId, isOwnPost = false } = route?.params || {};

  // Early return if postId is not provided
  if (!postId) {
    console.error('SinglePostScreen: postId is required');
    navigation.goBack();
    return null;
  }
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedAllowComments, setEditedAllowComments] = useState(true);
  const [editedShowLikeCount, setEditedShowLikeCount] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{id: string, authorId: string, parentCommentId?: string} | null>(null);
  const [showEditSuccessModal, setShowEditSuccessModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [editSuccessAnimation] = useState(new Animated.Value(0));
  const [deleteSuccessAnimation] = useState(new Animated.Value(0));
  const [replyToComment, setReplyToComment] = useState<{
    id: string;
    authorName: string;
  } | null>(null);
  const [newlyAddedReplyParentId, setNewlyAddedReplyParentId] = useState<string | undefined>(undefined);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const commentInputRef = useRef<TextInput>(null);

  const { t } = useTranslation();

  const currentTheme = getTheme(isDarkMode);
  const singlePostStyles = createSinglePostStyles(isDarkMode);

  // Initialize video player for video posts
  const videoPlayer = useVideoPlayer(
    post?.mediaURL && post?.mediaType === 'video' ? post.mediaURL : null, 
    player => {
      player.loop = true;
      player.muted = isVideoMuted;
      if (post?.mediaType === 'video' && post?.mediaURL) {
        player.play();
        setIsVideoPlaying(true);
      }
    }
  );

  const { isPlaying } = useEvent(videoPlayer, 'playingChange', { isPlaying: videoPlayer.playing });

  useEffect(() => {
    const initializeData = async () => {
      await loadCurrentUser();
      await loadPostData();
    };
    initializeData();

    // Set up real-time listeners
    const firestore = getFirestore();

    // Don't use real-time listener for comments to avoid conflicts with optimistic updates
    // Comments will be refreshed when needed (new comment, delete, etc.)

    // Listen to likes
    const likesQuery = query(collection(firestore, 'posts', postId, 'likes'));
    const unsubscribeLikes = onSnapshot(likesQuery, (snapshot) => {
      loadLikesData();
    });

    return () => {
      unsubscribeLikes();
    };
  }, [postId]);

  // Load comments and likes after currentUser is available
  useEffect(() => {
    if (currentUser && post) {
      const loadInitialData = async () => {
        await Promise.all([
          loadCommentsData(),
          loadLikesData()
        ]);
        setLoading(false);
      };
      loadInitialData();
    }
  }, [currentUser, post]);

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
        setEditedContent(postData.content || '');
        setEditedAllowComments(postData.allowComments !== false);
        setEditedShowLikeCount(postData.showLikeCount !== false);
        setPost(postData);
        // Comments and likes will be loaded after currentUser is set
      } else {
        Alert.alert(t('common.error'), t('singlePost.postNotFound'));
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert(t('common.error'), t('singlePost.failedToLoadPost'));
      setLoading(false);
    }
  };

  const loadCommentsData = async () => {
    try {
      const commentsData = await loadComments(postId, currentUser?.uid);
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

  const handleAddComment = async (commentText: string) => {
    if (!commentText || !commentText.trim() || !currentUser) return;

    try {
      setSubmittingComment(true);

      const currentUserData = {
        firstName: currentUser.displayName?.split(' ')[0] || '',
        lastName: currentUser.displayName?.split(' ')[1] || '',
        photoURL: currentUser.photoURL || ''
      };

      const parentCommentId = replyToComment?.id;

      await handleComment(
        postId,
        commentText.trim(),
        currentUser,
        post,
        parentCommentId
      );

      // Always update comment count for both top-level comments and replies
      // Update Redux state to keep both FeedScreen and UserPostsScreen in sync
      if (post) {
        // Get current comments count from Redux user posts (which is the source of truth)
        const currentPostFromRedux = userPosts.find(p => p.id === post.id);
        const currentCommentsCount = typeof currentPostFromRedux?.commentsCount === 'number' ? currentPostFromRedux.commentsCount : 0;
        const newCommentsCount = currentCommentsCount + 1;

        // Update Redux slices
        dispatch(updatePostInFeed({
          postId: post.id,
          updates: {
            commentsCount: newCommentsCount
          }
        }));

        dispatch(updatePostLike({
          postId: post.id,
          commentsCount: newCommentsCount
        }));

        // Sync local post state with Redux state
        setPost(prevPost => prevPost ? { 
          ...prevPost, 
          commentsCount: newCommentsCount 
        } : null);
      }

      // If this was a reply, mark it for auto-expand
      if (parentCommentId) {
        setNewlyAddedReplyParentId(parentCommentId);
        // Clear the marker after a short delay
        setTimeout(() => setNewlyAddedReplyParentId(undefined), 1000);
      }

      // Reset form
      setCommentText('');
      setReplyToComment(null);

      // Reload comments to get updated like status
      await loadCommentsData();

      // For top-level comments, scroll to the end to show the new comment
      if (!parentCommentId) {
        setTimeout(() => {
          // Trigger scroll to end by setting a temporary state
          setNewlyAddedReplyParentId('scroll-to-end');
          setTimeout(() => setNewlyAddedReplyParentId(undefined), 100);
        }, 500);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert(t('common.error'), t('singlePost.failedToAddComment'));
    } finally {
      setSubmittingComment(false);
    }
  };

    const handleReplyToComment = (commentId: string, authorName: string) => {
    setReplyToComment({ id: commentId, authorName });
    // Focus the input field after a short delay to ensure the UI has updated
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyToComment(null);
  };

  const handleVideoPlayPause = () => {
    if (isVideoPlaying) {
      videoPlayer.pause();
      setIsVideoPlaying(false);
    } else {
      videoPlayer.play();
      setIsVideoPlaying(true);
    }
  };

  const handleVideoMuteToggle = () => {
    const newMutedState = !isVideoMuted;
    setIsVideoMuted(newMutedState);
    videoPlayer.muted = newMutedState;
  };

  const handleLikeComment = async (commentId: string, parentCommentId: string | undefined, isCurrentlyLiked: boolean, t: any) => {
    if (!currentUser || !post) return;

    const newLikedState = !isCurrentlyLiked;
    const likesCountChange = newLikedState ? 1 : -1;

    try {
      // Update local state immediately for responsive UI
      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              isLikedByUser: newLikedState,
              likesCount: Math.max(0, (comment.likesCount || 0) + likesCountChange)
            };
          }
          return comment;
        });
      });

      // Then update Firebase
      await toggleCommentLike(
        post.id,
        commentId,
        currentUser.uid,
        isCurrentlyLiked,
        t,
        parentCommentId
      );

      // Don't reload comments data here - let the real-time listener handle it
      // But we need to make sure our local state persists
    } catch (error) {
      console.error('Error liking comment:', error);

      // Revert local state on error
      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              isLikedByUser: isCurrentlyLiked,
              likesCount: Math.max(0, (comment.likesCount || 0) - likesCountChange)
            };
          }
          return comment;
        });
      });

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
      setEditedAllowComments(post.allowComments !== false);
      setEditedShowLikeCount(post.showLikeCount !== false);
    }
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!currentUser || !post) return;

    try {
      await updatePost(
        postId,
        editedContent,
        false, // All posts are public now
        editedAllowComments,
        editedShowLikeCount,
        dispatch
      );

      // Update local state
      setPost({
        ...post,
        content: editedContent.trim(),
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

    setCommentToDelete({ id: commentId, authorId: commentAuthorId, parentCommentId });
    setShowDeleteCommentModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete || !post) return;

    setShowDeleteCommentModal(false);

    try {
      await deleteComment(post.id, commentToDelete.id, commentToDelete.parentCommentId);

      // Calculate how many comments will be deleted
      let deletedCommentsCount = 1; // The comment itself

      // Update local comments state immediately
      if (commentToDelete.parentCommentId) {
        // This is a reply - remove it from the comments array and update parent's reply count
        setComments(prevComments => {
          return prevComments.map(comment => {
            if (comment.id === commentToDelete.parentCommentId) {
              return {
                ...comment,
                repliesCount: Math.max(0, (comment.repliesCount || 1) - 1)
              };
            }
            return comment;
          }).filter(comment => comment.id !== commentToDelete.id);
        });
      } else {
        // This is a top-level comment - remove it and all its replies
        // Count how many replies this comment has before deleting
        const repliesToDelete = comments.filter(comment => comment.parentCommentId === commentToDelete.id);
        deletedCommentsCount += repliesToDelete.length; // Add the number of replies

        setComments(prevComments => {
          return prevComments.filter(comment => 
            comment.id !== commentToDelete.id && comment.parentCommentId !== commentToDelete.id
          );
        });
      }

      // Update comment count based on how many comments were actually deleted
      // Update Redux state to keep both FeedScreen and UserPostsScreen in sync
      if (post) {
        // Get current comments count from Redux user posts (which is the source of truth)
        const currentPostFromRedux = userPosts.find(p => p.id === post.id);
        const currentCommentsCount = typeof currentPostFromRedux?.commentsCount === 'number' ? currentPostFromRedux.commentsCount : 0;
        const newCommentsCount = Math.max(0, currentCommentsCount - deletedCommentsCount);

        // Update Redux slices
        dispatch(updatePostInFeed({
          postId: post.id,
          updates: {
            commentsCount: newCommentsCount
          }
        }));

        dispatch(updatePostLike({
          postId: post.id,
          commentsCount: newCommentsCount
        }));

        // Sync local post state with Redux state
        setPost(prevPost => prevPost ? { ...prevPost, commentsCount: newCommentsCount } : null);
      }

      setCommentToDelete(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
      Alert.alert(t('common.error'), t('singlePost.failedToDeleteComment'));
      setCommentToDelete(null);
    }
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
    <SafeAreaView style={[singlePostStyles.container, { backgroundColor: currentTheme.background, height: '100%' }]}>
      <SinglePostHeader
        onBack={() => navigation.goBack()}
        onEdit={handleEditPost}
        canEdit={isOwnPost && post?.authorId === currentUser?.uid}
        currentTheme={currentTheme}
      />

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={{ flex: 1 }}>
          <KeyboardAwareScrollView 
            style={{ flex: 1 }}
            enableOnAndroid={true}
            extraScrollHeight={20}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <SinglePostDisplay
              post={post}
              liked={userLiked}
              likesCount={likes.length}
              commentsCount={comments.length}
              onLikePress={handleLikePress}
              onCommentPress={() => {}}
              currentTheme={currentTheme}
              videoPlayer={videoPlayer}
              isVideoPlaying={isVideoPlaying}
              isVideoLoading={!!isVideoPlaying && !isPlaying}
              isVideoMuted={isVideoMuted}
              onVideoPlayPause={handleVideoPlayPause}
              onVideoMuteToggle={handleVideoMuteToggle}
            />

            {/* Comments Section */}
            <View style={[{ 
              paddingHorizontal: SPACING.md, 
              paddingTop: SPACING.md,
              backgroundColor: currentTheme.background 
            }]}>
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
                newlyAddedReplyParentId={newlyAddedReplyParentId}
              />
            </View>
          </KeyboardAwareScrollView>

          {/* Comment Input - Fixed at bottom with keyboard awareness */}
          {post.allowComments && currentUser && (
            <View style={[{ 
              backgroundColor: currentTheme.background,
              paddingTop: SPACING.sm 
            }]}>
              <CommentInput
                ref={commentInputRef}
                value={commentText}
                onChangeText={setCommentText}
                onSubmit={() => handleAddComment(commentText)}
                isSubmitting={submittingComment}
                currentTheme={currentTheme}
                replyToComment={replyToComment}
                onCancelReply={handleCancelReply}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Edit Post Modal */}
      <EditPostModal
        visible={isEditing}
        content={editedContent}
        allowComments={editedAllowComments}
        showLikeCount={editedShowLikeCount}
        onContentChange={setEditedContent}
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

      {/* Delete Comment Confirmation Modal */}
      <DeleteCommentConfirmationModal
        visible={showDeleteCommentModal}
        onConfirm={confirmDeleteComment}
        onCancel={() => {
          setShowDeleteCommentModal(false);
          setCommentToDelete(null);
        }}
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