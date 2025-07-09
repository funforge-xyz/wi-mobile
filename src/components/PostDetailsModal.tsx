
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { authService } from '../services/auth';
import {
  loadPost,
  loadComments,
  loadLikes,
  handleLike,
  handleComment,
  toggleCommentLike,
  deleteComment,
} from '../utils/singlePostUtils';
import { updatePost as updatePostInFeed } from '../store/feedSlice';
import { updatePostLike } from '../store/userSlice';
import { styles, modalStyles } from '../styles/SettingsStyles';
import SinglePostDisplay from './SinglePostDisplay';
import CommentsList from './CommentsList';
import CommentInput from './CommentInput';
import PostActions from './PostActions';
import DeleteCommentConfirmationModal from './DeleteCommentConfirmationModal';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { handlePostLike } from '../utils/feedUtils';

interface PostDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  currentTheme: any;
  onCommentsCountChange?: (newCount: number) => void;
}

export default function PostDetailsModal({ 
  visible, 
  onClose, 
  postId, 
  currentTheme, 
  onCommentsCountChange
}: PostDetailsModalProps) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const userPosts = useAppSelector((state) => state.user.posts);

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [replyToComment, setReplyToComment] = useState<{
    id: string;
    authorName: string;
  } | null>(null);
  const [newlyAddedReplyParentId, setNewlyAddedReplyParentId] = useState<string | undefined>(undefined);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{id: string, authorId: string, parentCommentId?: string} | null>(null);

  const commentInputRef = useRef<TextInput>(null);

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
    if (visible && postId) {
      loadData();
    }
  }, [visible, postId]);

  const resetState = () => {
    setPost(null);
    setComments([]);
    setLoading(true);
    setCommentText('');
    setReplyToComment(null);
    setNewlyAddedReplyParentId(undefined);
    setShowDeleteCommentModal(false);
    setCommentToDelete(null);
  };

  const handleClose = () => {
    onClose();
    resetState();
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Load current user
      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      // Load post data
      const postData = await loadPost(postId);
      if (postData) {
        setPost(postData);

        // Load comments
        const commentsData = await loadComments(postId, user?.uid);
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Error loading post data:', error);
    } finally {
      setLoading(false);
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

        // Notify parent component of the change (both for comments and replies)
        if (onCommentsCountChange) {
          onCommentsCountChange(newCommentsCount);
        }
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
      const updatedComments = await loadComments(postId, currentUser?.uid);
      setComments(updatedComments);

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

        // Notify parent component of the change (both for comments and replies)
        if (onCommentsCountChange) {
          onCommentsCountChange(newCommentsCount);
        }
      }

      setCommentToDelete(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
      Alert.alert(t('common.error'), t('singlePost.failedToDeleteComment'));
      setCommentToDelete(null);
    }
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

  

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity 
            onPress={handleClose}
            style={modalStyles.modalHeaderButton}
          >
            <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
            {`${t('singlePost.comments')} ${comments?.length ? `(${comments?.length})`:''}`}
          </Text>
          <View style={modalStyles.modalHeaderButton} />
        </View>

        {loading ? (
          <View style={postModalStyles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : post ? (
          <KeyboardAvoidingView 
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
          >
            <View style={{ flex: 1 }}>
              <KeyboardAwareScrollView 
                style={{ flex: 1 }}
                enableOnAndroid={true}
                extraScrollHeight={100}
                extraHeight={Platform.OS === 'ios' ? 100 : 150}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                enableAutomaticScroll={true}
                resetScrollToCoords={{ x: 0, y: 0 }}
                scrollEventThrottle={16}
              >
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
                    onShowReplies={() => {}}
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
        ) : (
          <View style={postModalStyles.errorContainer}>
            <Text style={[postModalStyles.errorText, { color: currentTheme.text }]}>
              {t('singlePost.postNotFound')}
            </Text>
          </View>
        )}

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
      </SafeAreaView>
    </Modal>
  );
}

const postModalStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
});
