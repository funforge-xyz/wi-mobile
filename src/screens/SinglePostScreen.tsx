import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
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
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import { authService } from '../services/auth';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

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

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    loadPost();
    loadCurrentUser();

    // Set up real-time listeners
    const firestore = getFirestore();

    // Listen to comments
    const commentsQuery = query(
      collection(firestore, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      loadComments();
    });

    // Listen to likes
    const likesQuery = query(collection(firestore, 'posts', postId, 'likes'));
    const unsubscribeLikes = onSnapshot(likesQuery, (snapshot) => {
      loadLikes();
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

  const loadPost = async () => {
    try {
      const firestore = getFirestore();
      const postDoc = await getDoc(doc(firestore, 'posts', postId));

      if (postDoc.exists()) {
        const postData = postDoc.data();

        // Get author information
        const authorDoc = await getDoc(doc(firestore, 'users', postData.authorId));
        const authorData = authorDoc.exists() ? authorDoc.data() : {};

        const postInfo: Post = {
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

        setEditedContent(postInfo.content);
        setEditedPrivacy(postInfo.isPrivate || false);

        setPost(postInfo);
        await loadComments();
        await loadLikes();
      } else {
        Alert.alert('Error', 'Post not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
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
        });
      }

      setComments(commentsList);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadLikes = async () => {
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

      setLikes(likesList);
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const handleLike = async () => {
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
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !currentUser || !post?.allowComments) return;

    try {
      setSubmittingComment(true);
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

      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
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
      const firestore = getFirestore();
      const postRef = doc(firestore, 'posts', postId);

      await updateDoc(postRef, {
        content: editedContent.trim(),
        isPrivate: editedPrivacy,
        allowComments: editedAllowComments,
        showLikeCount: editedShowLikeCount,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setPost({
        ...post,
        content: editedContent.trim(),
        isPrivate: editedPrivacy,
        allowComments: editedAllowComments,
        showLikeCount: editedShowLikeCount,
      });

      setIsEditing(false);
      Alert.alert('Success', 'Post updated successfully');
    } catch (error) {
      console.error('Error updating post:', error);
      Alert.alert('Error', 'Failed to update post');
    }
  };

  const handleDeletePost = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const firestore = getFirestore();
              const postRef = doc(firestore, 'posts', postId);
              await deleteDoc(postRef);

              Alert.alert('Success', 'Post deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          }
        }
      ]
    );
  };

  const handleDeleteComment = (commentId: string, commentAuthorId: string) => {
    // Only allow deletion if it's the user's own comment or their own post
    if (commentAuthorId !== currentUser?.uid && post?.authorId !== currentUser?.uid) {
      Alert.alert('Error', 'You can only delete your own comments');
      return;
    }

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const firestore = getFirestore();
              const commentRef = doc(firestore, 'posts', postId, 'comments', commentId);
              await deleteDoc(commentRef);
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment');
            }
          }
        }
      ]
    );
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays}d`;
    } else if (diffInHours > 0) {
      return `${diffInHours}h`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes}m`;
    } else {
      return 'now';
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      {item.authorPhotoURL ? (
        <Image source={{ uri: item.authorPhotoURL }} style={styles.commentAvatar} />
      ) : (
        <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder, { backgroundColor: currentTheme.border }]}>
          <Ionicons name="person" size={16} color={currentTheme.textSecondary} />
        </View>
      )}
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentAuthor, { color: currentTheme.text }]}>
            {item.authorName}
          </Text>
          <Text style={[styles.commentTime, { color: currentTheme.textSecondary }]}>
            {formatTimeAgo(item.createdAt)}
          </Text>
          {(item.authorId === currentUser?.uid || post?.authorId === currentUser?.uid) && (
            <TouchableOpacity 
              onPress={() => handleDeleteComment(item.id, item.authorId)}
              style={styles.deleteCommentButton}
            >
              <Ionicons name="trash-outline" size={14} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.commentText, { color: currentTheme.text }]}>
          {item.content}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: currentTheme.text }]}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const userLiked = likes.some(like => like.authorId === currentUser?.uid);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Post</Text>
        {isOwnPost && post?.authorId === currentUser?.uid ? (
          <TouchableOpacity onPress={handleEditPost}>
            <Ionicons name="create-outline" size={24} color={currentTheme.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <KeyboardAwareScrollView style={styles.content}>
        {/* Post */}
        <View style={[styles.postContainer, { backgroundColor: currentTheme.surface }]}>
          <View style={styles.postHeader}>
            {post.authorPhotoURL ? (
              <Image
                source={{ uri: post.authorPhotoURL }}
                style={styles.authorAvatar}
              />
            ) : (
              <View style={[styles.authorAvatar, styles.authorAvatarPlaceholder, { backgroundColor: currentTheme.border }]}>
                <Ionicons name="person" size={20} color={currentTheme.textSecondary} />
              </View>
            )}
            <View>
              <Text style={[styles.authorName, { color: currentTheme.text }]}>
                {post.authorName}
              </Text>
              <Text style={[styles.postTime, { color: currentTheme.textSecondary }]}>
                {formatTimeAgo(post.createdAt)}
              </Text>
            </View>
          </View>

          {post.content ? (
            <Text style={[styles.postContent, { color: currentTheme.text }]}>
              {post.content}
            </Text>
          ) : null}

          {post.mediaURL && (
            <View style={styles.mediaContainer}>
              <Image
                source={{ uri: post.mediaURL }}
                style={styles.postMedia}
                resizeMode="cover"
                onError={(error) => console.log('SinglePost image load error:', error.nativeEvent.error)}
                onLoad={() => console.log('SinglePost image loaded successfully:', post.mediaURL)}
              />
            </View>
          )}

          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons
                name={userLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={userLiked ? COLORS.error : currentTheme.textSecondary}
              />
              {post.showLikeCount && (
                <Text style={[styles.actionText, { color: currentTheme.textSecondary }]}>
                  {likes.length}
                </Text>
              )}
            </TouchableOpacity>
            {post.allowComments && (
              <View style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={24} color={currentTheme.textSecondary} />
                <Text style={[styles.actionText, { color: currentTheme.textSecondary }]}>
                  {comments.length}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Comments Section */}
        {post.allowComments ? (
          <View style={[styles.commentsSection, { backgroundColor: currentTheme.surface }]}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
              Comments ({comments.length})
            </Text>

            {comments.map((comment) => (
              <View key={comment.id}>
                {renderComment({ item: comment })}
              </View>
            ))}

            {comments.length === 0 && (
              <Text style={[styles.noCommentsText, { color: currentTheme.textSecondary }]}>
                No comments yet. Be the first to comment!
              </Text>
            )}
          </View>
        ) : (
          <View style={[styles.commentsSection, { backgroundColor: currentTheme.surface }]}>
            <Text style={[styles.commentsDisabledText, { color: currentTheme.textSecondary }]}>
              Comments are disabled for this post
            </Text>
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* Comment Input */}
      {post.allowComments && currentUser && (
        <View style={[styles.commentInputContainer, { 
          backgroundColor: currentTheme.surface,
          borderTopColor: currentTheme.border
        }]}>
          <TextInput
            style={[styles.commentInput, { 
              backgroundColor: currentTheme.background,
              color: currentTheme.text,
              borderColor: currentTheme.border
            }]}
            placeholder="Write a comment..."
            placeholderTextColor={currentTheme.textSecondary}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, { 
              backgroundColor: commentText.trim() ? COLORS.primary : currentTheme.border 
            }]}
            onPress={handleComment}
            disabled={!commentText.trim() || submittingComment}
          >
            {submittingComment ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Edit Post Modal */}
      <Modal visible={isEditing} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
            <TouchableOpacity onPress={() => setIsEditing(false)}>
              <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Edit Post</Text>
            <TouchableOpacity onPress={handleSaveEdit}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Content</Text>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: currentTheme.surface, 
                  color: currentTheme.text,
                  borderColor: currentTheme.border 
                }]}
                value={editedContent}
                onChangeText={setEditedContent}
                placeholder="What's on your mind?"
                placeholderTextColor={currentTheme.textSecondary}
                multiline
                numberOfLines={6}
              />
            </View>

            <View style={styles.modalSection}>
              <View style={styles.switchContainer}>
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Private Post</Text>
                <Switch
                  value={editedPrivacy}
                  onValueChange={setEditedPrivacy}
                  trackColor={{ false: currentTheme.border, true: COLORS.primary }}
                  thumbColor="white"
                />
              </View>
              <Text style={[styles.switchDescription, { color: currentTheme.textSecondary }]}>
                Private posts are only visible to your connections
              </Text>
            </View>

            <View style={styles.modalSection}>
              <View style={styles.switchContainer}>
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Allow Comments</Text>
                <Switch
                  value={editedAllowComments}
                  onValueChange={setEditedAllowComments}
                  trackColor={{ false: currentTheme.border, true: COLORS.primary }}
                  thumbColor="white"
                />
              </View>
            </View>

            <View style={styles.modalSection}>
              <View style={styles.switchContainer}>
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Show Like Count</Text>
                <Switch
                  value={editedShowLikeCount}
                  onValueChange={setEditedShowLikeCount}
                  trackColor={{ false: currentTheme.border, true: COLORS.primary }}
                  thumbColor="white"
                />
              </View>
            </View>

            <View style={styles.modalSection}>
              <TouchableOpacity 
                style={[styles.deleteButton, { borderColor: COLORS.error }]}
                onPress={handleDeletePost}
              >
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                <Text style={[styles.deleteButtonText, { color: COLORS.error }]}>Delete Post</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const lightTheme = {
  background: COLORS.background,
  surface: COLORS.surface,
  text: COLORS.text,
  textSecondary: COLORS.textSecondary,
  border: COLORS.border,
};

const darkTheme = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  errorText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  content: {
    flex: 1,
  },
  postContainer: {
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },
  authorAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  postTime: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  postContent: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  mediaContainer: {
    marginBottom: SPACING.sm,
  },
  postMedia: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  actionText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.xs,
  },
  commentsSection: {
    margin: SPACING.md,
    marginTop: 0,
    padding: SPACING.md,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: SPACING.sm,
  },
  commentAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  commentAuthor: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginRight: SPACING.sm,
  },
  commentTime: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  commentText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  noCommentsText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: SPACING.lg,
  },
  commentsDisabledText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: SPACING.lg,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    maxHeight: 100,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteCommentButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  modalSave: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  modalSection: {
    marginVertical: SPACING.md,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
  },
  textArea: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  switchDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.sm,
  },
});