import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import { collection, getDocs, doc, getDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';

const { width } = Dimensions.get('window');

interface ConnectionPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  mediaURL?: string;
  mediaType?: 'image' | 'video';
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
  allowLikes: boolean;
  allowComments: boolean;
}

interface PostItemProps {
  post: ConnectionPost;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  currentTheme: any;
}

const PostItem: React.FC<PostItemProps> = ({ post, onLike, onComment, onShare, currentTheme }) => {
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays}d ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours}h ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <View style={[styles.postContainer, { backgroundColor: currentTheme.surface }]}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          {post.authorPhotoURL ? (
            <Image source={{ uri: post.authorPhotoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: currentTheme.border }]}>
              <Ionicons name="person" size={20} color={currentTheme.textSecondary} />
            </View>
          )}
          <View>
            <Text style={[styles.username, { color: currentTheme.text }]}>{post.authorName}</Text>
            <Text style={[styles.timestamp, { color: currentTheme.textSecondary }]}>
              {formatTimeAgo(post.createdAt)}
            </Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={currentTheme.textSecondary} />
        </TouchableOpacity>
      </View>

      {post.content ? (
        <Text style={[styles.postContent, { color: currentTheme.text }]}>{post.content}</Text>
      ) : null}

      {post.mediaURL && post.mediaURL.trim() !== '' && (
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: post.mediaURL }}
            style={styles.postImage}
            resizeMode="cover"
            onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
            onLoad={() => console.log('Image loaded successfully:', post.mediaURL)}
          />
        </View>
      )}

      <View style={[styles.postActions, { borderTopColor: currentTheme.border }]}>
        {post.allowLikes && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onLike(post.id)}
          >
            <Ionicons name="heart-outline" size={24} color={currentTheme.textSecondary} />
            <Text style={[styles.actionText, { color: currentTheme.textSecondary }]}>{post.likesCount}</Text>
          </TouchableOpacity>
        )}

        {post.allowComments && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onComment(post.id)}
          >
            <Ionicons name="chatbubble-outline" size={24} color={currentTheme.textSecondary} />
            <Text style={[styles.actionText, { color: currentTheme.textSecondary }]}>{post.commentsCount}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onShare(post.id)}
        >
          <Ionicons name="share-outline" size={24} color={currentTheme.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function FeedScreen() {
  const [posts, setPosts] = useState<ConnectionPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    const setupAuthListener = async () => {
      try {
        const { getAuth } = await import('../services/firebase');
        const auth = getAuth();
        
        const unsubscribe = auth.onAuthStateChanged((user) => {
          if (user) {
            console.log('Auth state changed - user found:', user.uid);
            loadConnectionPosts();
          } else {
            console.log('Auth state changed - no user');
            setLoading(false);
            setPosts([]);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up auth listener:', error);
        setLoading(false);
      }
    };

    let unsubscribe: (() => void) | undefined;
    
    setupAuthListener().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const loadConnectionPosts = async () => {
    try {
      setLoading(true);
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.log('No current user found');
        setLoading(false);
        return;
      }

      const firestore = getFirestore();

      // Get user's connections
      const connectionsQuery = query(
        collection(firestore, 'connections'),
        where('participants', 'array-contains', currentUser.uid),
        where('status', '==', 'active')
      );
      const connectionsSnapshot = await getDocs(connectionsQuery);

      // Extract connected user IDs
      const connectedUserIds = new Set<string>();
      connectionsSnapshot.forEach((doc) => {
        const connectionData = doc.data();
        console.log('Connection data:', connectionData);
        const otherParticipant = connectionData.participants.find(
          (id: string) => id !== currentUser.uid
        );
        if (otherParticipant) {
          connectedUserIds.add(otherParticipant);
        }
      });

      if (connectedUserIds.size === 0) {
        console.log('No connections found, showing empty state');
        setPosts([]);
        setLoading(false);
        return;
      }

      // Get posts from connected users
      const postsCollection = collection(firestore, 'posts');
      const postsQuery = query(
        postsCollection,
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const postsSnapshot = await getDocs(postsQuery);

      const connectionPosts: ConnectionPost[] = [];

      for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data();
        // Only include posts from connected users
        if (!connectedUserIds.has(postData.authorId)) {
          continue;
        }

        // Skip private posts
        if (postData.isPrivate === true) {
          continue;
        }

        // Get author information
        const authorDoc = await getDoc(doc(firestore, 'users', postData.authorId));
        const authorData = authorDoc.exists() ? authorDoc.data() : {};

        // Get likes count
        const likesCollection = collection(firestore, 'posts', postDoc.id, 'likes');
        const likesSnapshot = await getDocs(likesCollection);

        // Get comments count
        const commentsCollection = collection(firestore, 'posts', postDoc.id, 'comments');
        const commentsSnapshot = await getDocs(commentsCollection);

        const postInfo = {
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
          likesCount: likesSnapshot.size,
          commentsCount: commentsSnapshot.size,
          allowLikes: postData.allowLikes !== false,
          allowComments: postData.allowComments !== false,
        };

        console.log('Adding post to feed:', {
          id: postInfo.id,
          authorName: postInfo.authorName,
          hasContent: !!postInfo.content,
          hasMediaURL: !!postInfo.mediaURL,
          mediaURL: postInfo.mediaURL
        });

        connectionPosts.push(postInfo);

        // Limit to 20 posts for performance
        if (connectionPosts.length >= 20) {
          break;
        }
      }

      console.log('Final connection posts:', connectionPosts.length);
      setPosts(connectionPosts);
    } catch (error) {
      console.error('Error loading connection posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConnectionPosts();
    setRefreshing(false);
  };

  const handleLike = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, likesCount: post.likesCount + 1 }
          : post
      )
    );
  };

  const handleComment = (postId: string) => {
    Alert.alert('Comments', 'Comments functionality coming soon!');
  };

  const handleShare = (postId: string) => {
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={currentTheme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>No Posts from Connections</Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
        Connect with people nearby to see their posts here!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Feed</Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color={currentTheme.text} />
          </TouchableOpacity>
        </View>
        <View style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Feed</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color={currentTheme.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostItem
            post={item}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            currentTheme={currentTheme}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : undefined}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContainer: {
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  username: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  postContent: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  mediaContainer: {
    marginBottom: SPACING.sm,
  },
  postImage: {
    width: width,
    height: 300,
  },
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
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
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 24,
  },
});