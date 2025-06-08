import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
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
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import { authService } from '../services/auth';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  mediaURL?: string;
  mediaType?: 'image' | 'video';
  createdAt: Date;
  allowLikes: boolean;
  allowComments: boolean;
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
  const { postId } = route.params;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
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
          allowLikes: postData.allowLikes !== false,
          allowComments: postData.allowComments !== false,
        };

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
    if (!currentUser || !post?.allowLikes) return;

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

      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays}d ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours}h ago`;
    } else {
      return 'Just now';
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
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Post */}
        <View style={[styles.postContainer, { backgroundColor: currentTheme.surface }]}>
          <View style={styles.postHeader}>
            <Image
              source={{ uri: post.authorPhotoURL || 'https://via.placeholder.com/40' }}
              style={styles.authorAvatar}
            />
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
            <View style={{ marginBottom: SPACING.sm }}>
              <Image
                source={{ uri: post.mediaURL }}
                style={styles.postMedia}
                resizeMode="cover"
              />
            </View>
          )}

          <View style={styles.postActions}>
            {post.allowLikes && (
              <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                <Ionicons
                  name={userLiked ? 'heart' : 'heart-outline'}
                  size={24}
                  color={userLiked ? COLORS.error : currentTheme.textSecondary}
                />
                <Text style={[styles.actionText, { color: currentTheme.textSecondary }]}>
                  {likes.length}
                </Text>
              </TouchableOpacity>
            )}
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
        {post.allowComments && (
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
        )}
      </ScrollView>

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
});