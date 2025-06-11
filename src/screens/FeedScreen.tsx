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
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import { collection, getDocs, doc, getDoc, query, orderBy, limit, where, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import { getAuth } from '../services/firebase';
import NotificationBell from '../components/NotificationBell';
import SkeletonLoader from '../components/SkeletonLoader';

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
  showLikeCount: boolean;
  allowComments: boolean;
  isLikedByUser: boolean;
  isAuthorOnline: boolean;
}

interface PostItemProps {
  post: ConnectionPost;
  onLike: (postId: string, liked: boolean) => void;
  currentTheme: any;
  navigation: any;
}

const PostItem: React.FC<PostItemProps> = ({ post, onLike, currentTheme, navigation }) => {
  const [liked, setLiked] = useState(post.isLikedByUser);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 6) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } else if (diffInDays > 0) {
      return `${diffInDays}d`;
    } else if (diffInHours > 0) {
      return `${diffInHours}h`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes}m`;
    } else {
      return 'now';
    }
  };

  const handleLikePress = () => {
    onLike(post.id, liked);
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
  };

  return (
    <TouchableOpacity 
      style={[styles.postContainer, { backgroundColor: currentTheme.surface }]}
      onPress={() => navigation.navigate('SinglePost', { postId: post.id })}
      activeOpacity={0.95}
    >
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {post.authorPhotoURL ? (
              <AvatarImage source={{ uri: post.authorPhotoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: currentTheme.border }]}>
                <Ionicons name="person" size={20} color={currentTheme.textSecondary} />
              </View>
            )}
            {post.isAuthorOnline && (
              <View style={styles.onlineIndicator} />
            )}
          </View>
          <View>
            <View style={styles.usernameRow}>
              <Text style={[styles.username, { color: currentTheme.text }]}>{post.authorName}</Text>
            </View>
            <Text style={[styles.timestamp, { color: currentTheme.textSecondary }]}>
              {formatTimeAgo(post.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {post.content ? (
        <Text style={[styles.postContent, { color: currentTheme.text }]}>{post.content}</Text>
      ) : null}

      {post.mediaURL && post.mediaURL.trim() !== '' && (
        <View style={styles.mediaContainer}>
          <PostImage
            source={{ uri: post.mediaURL }}
            style={styles.postImage}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={[styles.postActions, { borderTopColor: currentTheme.border }]}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLikePress}
        >
          <Ionicons name={liked ? "heart" : "heart-outline"} size={24} color={liked ? "red" : currentTheme.textSecondary} />
          {post.showLikeCount && (
            <Text style={[styles.actionText, { color: currentTheme.textSecondary }]}>{likesCount}</Text>
          )}
        </TouchableOpacity>

        {post.allowComments && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('SinglePost', { postId: post.id })}
          >
            <Ionicons name="chatbubble-outline" size={24} color={currentTheme.textSecondary} />
            <Text style={[styles.actionText, { color: currentTheme.textSecondary }]}>{post.commentsCount}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function FeedScreen({ navigation }: any) {
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

        const unsubscribe = auth.onAuthStateChanged((user:any) => {
          if (user) {
            loadConnectionPosts();
          } else {
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

    // Handle app state changes to update lastSeen
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        updateUserLastSeen();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Update lastSeen when app goes to background to show user as offline
        updateUserLastSeen();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Set up interval to update lastSeen every 30 seconds
    const lastSeenInterval = setInterval(updateUserLastSeen, 30000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(lastSeenInterval);
      appStateSubscription?.remove();
    };
  }, []);

  const updateUserLastSeen = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();
      const userRef = doc(firestore, 'users', currentUser.uid);
      await setDoc(userRef, {
        lastSeen: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  };

  const loadConnectionPosts = async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.log('No current user found');
        setLoading(false);
        return;
      }

      // Update user's lastSeen timestamp
      updateUserLastSeen();

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

        // Get likes count and check if user liked
        const likesCollection = collection(firestore, 'posts', postDoc.id, 'likes');
        const likesSnapshot = await getDocs(likesCollection);

        let isLikedByUser = false;
        likesSnapshot.forEach((likeDoc) => {
          if (likeDoc.data().authorId === currentUser.uid) {
            isLikedByUser = true;
          }
        });

        // Get comments count
        const commentsCollection = collection(firestore, 'posts', postDoc.id, 'comments');
        const commentsSnapshot = await getDocs(commentsCollection);

        // Check if user is online (last seen within 2 minutes to be more accurate)
        const isOnline = authorData.lastSeen && 
          authorData.lastSeen.toDate && 
          (new Date().getTime() - authorData.lastSeen.toDate().getTime()) < 2 * 60 * 1000;

        const postInfo = {
          id: postDoc.id,
          authorId: postData.authorId,
          authorName: authorData.firstName && authorData.lastName 
            ? `${authorData.firstName} ${authorData.lastName}` 
            : 'Anonymous User',
          authorPhotoURL: authorData.thumbnailURL || authorData.photoURL || '',
          content: postData.content || '',
          mediaURL: postData.mediaURL || '',
          mediaType: postData.mediaType || 'image',
          createdAt: postData.createdAt?.toDate() || new Date(),
          likesCount: likesSnapshot.size,
          commentsCount: commentsSnapshot.size,
          showLikeCount: postData.showLikeCount !== false,
          allowComments: postData.allowComments !== false,
          isLikedByUser: isLikedByUser,
          isAuthorOnline: isOnline || false,
        };

        connectionPosts.push(postInfo);

        // Limit to 20 posts for performance
        if (connectionPosts.length >= 20) {
          break;
        }
      }

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

  const handleLike = async (postId: string, liked: boolean) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log('No current user found');
      return;
    }

    const firestore = getFirestore();
    const likeRef = doc(firestore, 'posts', postId, 'likes', currentUser.uid);

    try {
      if (liked) {
        await deleteDoc(likeRef);
        console.log("Post unliked");
      } else {
        await setDoc(likeRef, {
          authorId: currentUser.uid,
          createdAt: new Date(),
        });
        console.log("Post liked");

        // Create notification for the post author
        const post = posts.find(p => p.id === postId);
        if (post && post.authorId !== currentUser.uid) {
          // Get current user info
          const currentUserDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
          const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : {};
          const currentUserName = currentUserData.firstName && currentUserData.lastName 
            ? `${currentUserData.firstName} ${currentUserData.lastName}` 
            : 'Someone';

          // Create notification
          await addDoc(collection(firestore, 'notifications'), {
            type: 'like',
            title: 'New Like',
            body: `${currentUserName} liked your post`,
            postId: postId,
            targetUserId: post.authorId,
            fromUserId: currentUser.uid,
            fromUserName: currentUserName,
            fromUserPhotoURL: currentUserData.photoURL || '',
            createdAt: new Date(),
            read: false,
          });
        }
      }

      // Optimistically update the UI
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likesCount: liked ? post.likesCount - 1 : post.likesCount + 1,
                isLikedByUser: !liked,
              }
            : post
        )
      );
    } catch (error) {
      console.error("Error liking/unliking post:", error);
      Alert.alert("Error", "Failed to like/unlike post");
    }
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
        <NotificationBell 
          onPress={() => navigation.navigate('Notifications')} 
          color={currentTheme.text}
        />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostItem
            post={item}
            onLike={handleLike}
            currentTheme={currentTheme}
            navigation={navigation}
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

const AvatarImage = ({ source, style, ...props }: { source: any; style: any; [key: string]: any }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [source?.uri]);

  return (
    <View style={[style, { position: 'relative' }]}>
      {loading && !error && (
        <SkeletonLoader
          width={style?.width || 40}
          height={style?.height || 40}
          borderRadius={style?.borderRadius || 20}
          style={{ position: 'absolute' }}
        />
      )}
      <Image
        source={source}
        style={[style, { opacity: loading || error ? 0 : 1 }]}
        onLoadStart={() => {
          setLoading(true);
          setError(false);
        }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        {...props}
      />
    </View>
  );
};

const PostImage = ({ source, style, ...props }: { source: any; style: any; [key: string]: any }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [source?.uri]);

  return (
    <View style={[style, { position: 'relative' }]}>
      {loading && !error && (
        <SkeletonLoader
          width={style?.width || width}
          height={style?.height || 300}
          borderRadius={style?.borderRadius || 0}
          style={{ position: 'absolute' }}
        />
      )}
      <Image
        source={source}
        style={[style, { opacity: loading || error ? 0 : 1 }]}
        onLoadStart={() => {
          setLoading(true);
          setError(false);
        }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        {...props}
      />
    </View>
  );
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
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
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