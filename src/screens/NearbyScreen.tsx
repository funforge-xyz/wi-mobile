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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import { Settings } from '../services/storage';
import { authService } from '../services/auth';
import { collection, getDocs, doc, getDoc, query, orderBy, limit, where, addDoc, deleteDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import NotificationBell from '../components/NotificationBell';
import SkeletonLoader from '../components/SkeletonLoader';

interface NearbyUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio: string;
  isOnline?: boolean;
}



interface NearbyPost {
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
  isLikedByUser?: boolean;
}

const AvatarImage = ({ source, style }: { source: any, style: any }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [source?.uri]);

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      {loading && !error && (
        <SkeletonLoader
          width={style?.width || 50}
          height={style?.height || 50}
          borderRadius={style?.borderRadius || 25}
          style={{ position: 'absolute', zIndex: 1 }}
        />
      )}
      <Image
        source={source}
        style={[style, { opacity: loading ? 0 : 1 }]}
        onLoadStart={() => {
          setLoading(true);
          setError(false);
        }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </View>
  );
};

const PostImage = ({ source, style }: { source: any, style: any }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [source?.uri]);

  return (
    <View style={[style, { position: 'relative', overflow: 'hidden' }]}>
      {loading && !error && (
        <SkeletonLoader
          width={style?.width || 300}
          height={style?.height || 200}
          borderRadius={style?.borderRadius || 8}
          style={{ position: 'absolute', zIndex: 1 }}
        />
      )}
      <Image
        source={source}
        style={[style, { opacity: loading ? 0 : 1 }]}
        onLoadStart={() => {
          setLoading(true);
          setError(false);
        }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </View>
  );
};

export default function NearbyScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'people' | 'posts'>('people');
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [nearbyPosts, setNearbyPosts] = useState<NearbyPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'people') {
        await loadNearbyUsers();
      } else if (activeTab === 'posts') {
        await loadNearbyPosts();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyUsers = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();

      // Get blocked users
      const blockedUsersQuery = query(
        collection(firestore, 'blockedUsers'),
        where('blockerUserId', '==', currentUser.uid)
      );
      const blockedUsersSnapshot = await getDocs(blockedUsersQuery);
      const blockedUserIds = new Set();
      blockedUsersSnapshot.forEach((doc) => {
        blockedUserIds.add(doc.data().blockedUserId);
      });

      // Get users who blocked current user
      const blockedByUsersQuery = query(
        collection(firestore, 'blockedUsers'),
        where('blockedUserId', '==', currentUser.uid)
      );
      const blockedByUsersSnapshot = await getDocs(blockedByUsersQuery);
      blockedByUsersSnapshot.forEach((doc) => {
        blockedUserIds.add(doc.data().blockerUserId);
      });

      // Get connected users
      const connectionsQuery = query(
        collection(firestore, 'connections'),
        where('participants', 'array-contains', currentUser.uid),
        where('status', '==', 'active')
      );
      const connectionsSnapshot = await getDocs(connectionsQuery);
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

      const usersCollection = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersCollection);

      const users: NearbyUser[] = [];

      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        // Exclude current user, blocked users, and connected users
        if (doc.id !== currentUser.uid && 
            !blockedUserIds.has(doc.id) && 
            !connectedUserIds.has(doc.id)) {
          users.push({
            id: doc.id,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            photoURL: userData.thumbnailURL || userData.photoURL || '',
            bio: userData.bio || '',
            isOnline: Math.random() > 0.5, // Mock online status
          });
        }
      });

      setNearbyUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadNearbyPosts = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();

      // Get connected users
      const connectionsQuery = query(
        collection(firestore, 'connections'),
        where('participants', 'array-contains', currentUser.uid),
        where('status', '==', 'active')
      );
      const connectionsSnapshot = await getDocs(connectionsQuery);
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

      // Get blocked users
      const blockedUsersQuery = query(
        collection(firestore, 'blockedUsers'),
        where('blockerUserId', '==', currentUser.uid)
      );
      const blockedUsersSnapshot = await getDocs(blockedUsersQuery);
      const blockedUserIds = new Set();
      blockedUsersSnapshot.forEach((doc) => {
        blockedUserIds.add(doc.data().blockedUserId);
      });

      // Get users who blocked current user
      const blockedByUsersQuery = query(
        collection(firestore, 'blockedUsers'),
        where('blockedUserId', '==', currentUser.uid)
      );
      const blockedByUsersSnapshot = await getDocs(blockedByUsersQuery);
      blockedByUsersSnapshot.forEach((doc) => {
        blockedUserIds.add(doc.data().blockerUserId);
      });

      const postsCollection = collection(firestore, 'posts');

      // Get all posts
      const postsQuery = query(
        postsCollection,
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const postsSnapshot = await getDocs(postsQuery);

      const posts: NearbyPost[] = [];

      for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data();

        // Exclude current user's posts
        if (postData.authorId === currentUser.uid) {
          continue;
        }

        // Exclude posts from connected users
        if (connectedUserIds.has(postData.authorId)) {
          continue;
        }

        // Exclude posts from blocked users
        if (blockedUserIds.has(postData.authorId)) {
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

        posts.push({
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
        });

        // Limit to 20 posts for performance
        if (posts.length >= 20) {
          break;
        }
      }

      setNearbyPosts(posts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };



  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUserPress = (user: NearbyUser) => {
    // Navigate to user profile
    navigation.navigate('Profile', { userId: user.id });
  };

  const handleMessageUser = async (user: NearbyUser) => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to send messages');
        return;
      }

      const firestore = getFirestore();

      // Check if there's already a connection or request between users
      const existingConnectionQuery = query(
        collection(firestore, 'connections'),
        where('participants', 'array-contains', currentUser.uid)
      );
      const connectionsSnapshot = await getDocs(existingConnectionQuery);

      let hasConnection = false;
      connectionsSnapshot.forEach((doc) => {
        const connectionData = doc.data();
        if (connectionData.participants.includes(user.id) && connectionData.status === 'active') {
          hasConnection = true;
        }
      });

      // Check for existing requests
      const existingRequestQuery = query(
        collection(firestore, 'connectionRequests'),
        where('fromUserId', '==', currentUser.uid),
        where('toUserId', '==', user.id),
        where('status', '==', 'pending')
      );
      const requestSnapshot = await getDocs(existingRequestQuery);

      let hasRequest = false;
      if (!requestSnapshot.empty) {
        hasRequest = true;
      }

      // If no connection and no pending request, create a request
      if (!hasConnection && !hasRequest) {
        await addDoc(collection(firestore, 'connectionRequests'), {
          fromUserId: currentUser.uid,
          toUserId: user.id,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Get current user info for notification
        const currentUserDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
        const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : {};
        const currentUserName = currentUserData.firstName && currentUserData.lastName 
          ? `${currentUserData.firstName} ${currentUserData.lastName}` 
          : 'Someone';

        // Create notification for the target user
        await addDoc(collection(firestore, 'notifications'), {
          type: 'nearby_request',
          title: 'New Connection Request',
          body: `${currentUserName} wants to connect with you`,
          targetUserId: user.id,
          fromUserId: currentUser.uid,
          fromUserName: currentUserName,
          fromUserPhotoURL: currentUserData.photoURL || '',
          createdAt: new Date(),
          read: false,
        });
      }

      // Navigate to chat screen with this user
      navigation.navigate('Chat', { 
        userId: user.id,
        userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Anonymous User',
        userPhotoURL: user.photoURL
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat');
    }
  };

  const handlePostPress = (post: NearbyPost) => {
    // Navigate to single post screen
    navigation.navigate('SinglePost', { postId: post.id });
  };

  const handleLike = async (postId: string) => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to like posts');
        return;
      }

      const firestore = getFirestore();
      const likesCollection = collection(firestore, 'posts', postId, 'likes');

      // Check if user already liked this post
      const post = nearbyPosts.find(p => p.id === postId);
      if (!post) return;

      if (post.isLikedByUser) {
        // Unlike: Find and delete the user's like
        const likesSnapshot = await getDocs(likesCollection);
        let userLikeDoc = null;

        likesSnapshot.forEach((likeDoc) => {
          if (likeDoc.data().authorId === currentUser.uid) {
            userLikeDoc = likeDoc;
          }
        });

        if (userLikeDoc) {
          await deleteDoc(doc(firestore, 'posts', postId, 'likes', userLikeDoc.id));
        }

        // Update UI
        setNearbyPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === postId
              ? { ...p, likesCount: Math.max(0, p.likesCount - 1), isLikedByUser: false }
              : p
          )
        );
      } else {
        // Like: Add new like
        await addDoc(likesCollection, {
          authorId: currentUser.uid,
          createdAt: new Date(),
        });

        // Create notification for the post author if it's not the current user
        if (post.authorId !== currentUser.uid) {
          // Get current user info
          const currentUserDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
          const currentUserData = currentUserDoc.exists() ? currentUserData.data() : {};
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

        // Update UI
        setNearbyPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === postId
              ? { ...p, likesCount: p.likesCount + 1, isLikedByUser: true }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error handling like:', error);
      Alert.alert('Error', 'Failed to update like');
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

  const renderUserItem = ({ item }: { item: NearbyUser }) => (
    <View
      style={[styles.userItem, { backgroundColor: currentTheme.surface }]}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.photoURL ? (
            <AvatarImage 
              source={{ 
                uri: item.photoURL,
                cache: 'reload'
              }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: currentTheme.border }]}>
              <Ionicons name="person" size={24} color={currentTheme.textSecondary} />
            </View>
          )}
          {item.isOnline && <View style={[styles.onlineIndicator, { borderColor: currentTheme.surface }]} />}
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: currentTheme.text }]}>
            {item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : 'Anonymous User'}
          </Text>
          {item.bio ? (
            <Text style={[styles.userBio, { color: currentTheme.textSecondary }]} numberOfLines={2}>
              {item.bio}
            </Text>
          ) : null}
        </View>
      </View>
      <TouchableOpacity
        style={styles.messageIconButton}
        onPress={() => handleMessageUser(item)}
      >
        <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );



  const renderPostItem = ({ item: post }: { item: NearbyPost }) => (
    <TouchableOpacity
      style={[styles.postItem, { backgroundColor: currentTheme.surface }]}
      onPress={() => handlePostPress(post)}
    >
      <View style={styles.postHeader}>
        <View style={styles.postAuthorInfo}>
          {post.authorPhotoURL ? (
            <AvatarImage
              source={{ uri: post.authorPhotoURL }} 
              style={styles.postAuthorAvatar}
            />
          ) : (
            <View style={[styles.postAuthorAvatar, styles.postAuthorAvatarPlaceholder, { backgroundColor: currentTheme.border }]}>
              <Ionicons name="person" size={20} color={currentTheme.textSecondary} />
            </View>
          )}
          <View>
            <Text style={[styles.postAuthorName, { color: currentTheme.text }]}>
              {post.authorName}
            </Text>
            <Text style={[styles.postTime, { color: currentTheme.textSecondary }]}>
              {formatTimeAgo(post.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {post.content ? (
        <Text style={[styles.postContent, { color: currentTheme.text }]} numberOfLines={3}>
          {post.content}
        </Text>
      ) : null}

      {post.mediaURL && post.mediaURL.trim() !== '' && (
        <TouchableOpacity onPress={() => handlePostPress(post)}>
          <PostImage
            source={{ uri: post.mediaURL }}
            style={styles.postMedia}
          />
        </TouchableOpacity>
      )}

      <View style={styles.postStats}>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => handleLike(post.id)}
        >
          <Ionicons 
            name={post.isLikedByUser ? "heart" : "heart-outline"} 
            size={16} 
            color={post.isLikedByUser ? COLORS.error : currentTheme.textSecondary} 
          />
          {post.showLikeCount && (
            <Text style={[styles.statText, { color: currentTheme.textSecondary }]}>
              {post.likesCount}
            </Text>
          )}
        </TouchableOpacity>
        {post.allowComments && (
          <TouchableOpacity style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={16} color={currentTheme.textSecondary} />
            <Text style={[styles.statText, { color: currentTheme.textSecondary }]}>
              {post.commentsCount}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    const getEmptyStateConfig = () => {
      switch (activeTab) {
        case 'people':
          return {
            icon: 'people-outline',
            title: 'No People Found',
            subtitle: 'There are no people to show right now.'
          };
        case 'posts':
          return {
            icon: 'document-text-outline',
            title: 'No Posts Found',
            subtitle: 'There are no posts to show right now.'
          };
        default:
          return {
            icon: 'people-outline',
            title: 'No Data',
            subtitle: 'Nothing to show right now.'
          };
      }
    };

    const config = getEmptyStateConfig();

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={config.icon as any}
          size={64}
          color={currentTheme.textSecondary}
        />
        <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
          {config.title}
        </Text>
        <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
          {config.subtitle}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Nearby</Text>
        <NotificationBell 
          onPress={() => navigation.navigate('Notifications')} 
          color={currentTheme.text}
        />
      </View>

      <View style={[styles.tabContainer, { backgroundColor: currentTheme.surface }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'people' && styles.activeTab]}
          onPress={() => setActiveTab('people')}
        >
          <Text style={[
            styles.tabText, 
            { color: currentTheme.textSecondary }, 
            activeTab === 'people' && styles.activeTabText
          ]}>
            People
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[
            styles.tabText, 
            { color: currentTheme.textSecondary }, 
            activeTab === 'posts' && styles.activeTabText
          ]}>
            Posts
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'people' ? nearbyUsers : nearbyPosts}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 'people' ? renderUserItem : renderPostItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            (activeTab === 'people' ? nearbyUsers : nearbyPosts).length === 0
              ? styles.emptyContainer
              : styles.listContent
          }
        />
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
    paddingTop: 0,
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary + '20',
  },
  tabText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  userBio: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 16,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  postItem: {
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  postAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAuthorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },
  postAuthorAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  postAuthorName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  postTime: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  postContent: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  postMedia: {
    width: '100%',
    height: 200,
    marginTop: SPACING.sm,
    borderRadius: 8,
  },
  postMediaPlaceholder: {
    width: '100%',
    height: 200,
    marginTop: SPACING.sm,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: SPACING.xs,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  lastMessage: {
```text
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  messageTime: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  unreadText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: 'white',
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
  },
  connectionActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
});