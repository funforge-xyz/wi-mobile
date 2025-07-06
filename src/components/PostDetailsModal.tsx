
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
  Dimensions,
  PanResponder,
  Animated,
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
import SinglePostDisplay from './SinglePostDisplay';
import CommentsList from './CommentsList';
import CommentInput from './CommentInput';
import PostActions from './PostActions';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PostDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  currentTheme: any;
}

export default function PostDetailsModal({
  visible,
  onClose,
  postId,
  currentTheme,
}: PostDetailsModalProps) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const userPosts = useAppSelector((state) => state.user.posts);

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
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
  
  const commentInputRef = useRef<TextInput>(null);
  const pan = useRef(new Animated.Value(0)).current;
  const modalHeight = useRef(new Animated.Value(SCREEN_HEIGHT * 0.1)).current;

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

  // Pan responder for swipe to close
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        pan.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100) {
        closeModal();
      } else {
        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  useEffect(() => {
    if (visible && postId) {
      openModal();
      loadData();
    }
  }, [visible, postId]);

  const openModal = () => {
    Animated.timing(modalHeight, {
      toValue: SCREEN_HEIGHT * 0.9,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalHeight, {
      toValue: SCREEN_HEIGHT * 0.1,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      onClose();
      resetState();
    });
  };

  const resetState = () => {
    setPost(null);
    setComments([]);
    setLikes([]);
    setLoading(true);
    setCommentText('');
    setReplyToComment(null);
    setNewlyAddedReplyParentId(undefined);
    pan.setValue(0);
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
        
        // Load comments and likes
        const [commentsData, likesData] = await Promise.all([
          loadComments(postId, user?.uid),
          loadLikes(postId)
        ]);
        
        setComments(commentsData);
        setLikes(likesData);
      }
    } catch (error) {
      console.error('Error loading post data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikePress = async () => {
    if (!currentUser || !post) return;
    
    try {
      await handleLike(postId, likes, currentUser);
      // Reload likes to get updated state
      const updatedLikes = await loadLikes(postId);
      setLikes(updatedLikes);
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleAddComment = async (commentText: string) => {
    if (!commentText || !commentText.trim() || !currentUser) return;

    try {
      setSubmittingComment(true);

      const parentCommentId = replyToComment?.id;

      await handleComment(
        postId,
        commentText.trim(),
        currentUser,
        post,
        parentCommentId
      );

      // Update comment count in Redux
      if (post) {
        const currentPostFromRedux = userPosts.find(p => p.id === post.id);
        const currentCommentsCount = typeof currentPostFromRedux?.commentsCount === 'number' ? currentPostFromRedux.commentsCount : 0;
        const newCommentsCount = currentCommentsCount + 1;

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

        setPost(prevPost => prevPost ? { 
          ...prevPost, 
          commentsCount: newCommentsCount 
        } : null);
      }

      // Handle reply marking
      if (parentCommentId) {
        setNewlyAddedReplyParentId(parentCommentId);
        setTimeout(() => setNewlyAddedReplyParentId(undefined), 1000);
      }

      // Reset form
      setCommentText('');
      setReplyToComment(null);

      // Reload comments
      const updatedComments = await loadComments(postId, currentUser?.uid);
      setComments(updatedComments);

      if (!parentCommentId) {
        setTimeout(() => {
          setNewlyAddedReplyParentId('scroll-to-end');
          setTimeout(() => setNewlyAddedReplyParentId(undefined), 100);
        }, 500);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReplyToComment = (commentId: string, authorName: string) => {
    setReplyToComment({ id: commentId, authorName });
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
      // Update local state immediately
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

      // Update Firebase
      await toggleCommentLike(
        post.id,
        commentId,
        currentUser.uid,
        isCurrentlyLiked,
        t,
        parentCommentId
      );
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
    }
  };

  const handleDeleteComment = async (commentId: string, commentAuthorId: string, parentCommentId?: string) => {
    if (!currentUser || (commentAuthorId !== currentUser.uid && post?.authorId !== currentUser.uid)) {
      return;
    }

    try {
      await deleteComment(post.id, commentId, parentCommentId);
      
      // Update local state and comment count
      let deletedCommentsCount = 1;
      
      if (parentCommentId) {
        setComments(prevComments => {
          return prevComments.map(comment => {
            if (comment.id === parentCommentId) {
              return {
                ...comment,
                repliesCount: Math.max(0, (comment.repliesCount || 1) - 1)
              };
            }
            return comment;
          }).filter(comment => comment.id !== commentId);
        });
      } else {
        const repliesToDelete = comments.filter(comment => comment.parentCommentId === commentId);
        deletedCommentsCount += repliesToDelete.length;

        setComments(prevComments => {
          return prevComments.filter(comment => 
            comment.id !== commentId && comment.parentCommentId !== commentId
          );
        });
      }

      // Update Redux state
      if (post) {
        const currentPostFromRedux = userPosts.find(p => p.id === post.id);
        const currentCommentsCount = typeof currentPostFromRedux?.commentsCount === 'number' ? currentPostFromRedux.commentsCount : 0;
        const newCommentsCount = Math.max(0, currentCommentsCount - deletedCommentsCount);

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

        setPost(prevPost => prevPost ? { ...prevPost, commentsCount: newCommentsCount } : null);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
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

  const userLiked = likes.some(like => like.authorId === currentUser?.uid);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={closeModal}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              height: modalHeight,
              transform: [{ translateY: pan }],
              backgroundColor: currentTheme.background,
            }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Handle bar */}
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: currentTheme.border }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={currentTheme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
              {t('singlePost.postDetails')}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : post ? (
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
                  {/* Post Display */}
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
                      onShowReplies={() => {}}
                      currentTheme={currentTheme}
                      newlyAddedReplyParentId={newlyAddedReplyParentId}
                    />
                  </View>
                </KeyboardAwareScrollView>

                {/* Comment Input */}
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
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: currentTheme.text }]}>
                {t('singlePost.postNotFound')}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: SPACING.sm,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
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
