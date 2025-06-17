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
  AppState,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import { collection, getDocs, doc, getDoc, query, orderBy, limit, where, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import { getAuth } from '../services/firebase';
import { locationService } from '../services/locationService';
import NotificationBell from '../components/NotificationBell';
import SkeletonLoader from '../components/SkeletonLoader';
import FeedSkeleton from '../components/FeedSkeleton';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

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
  isFromConnection: boolean;
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

  const { t } = useTranslation();

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
      return t('time.daysAgo', { count: diffInDays });
    } else if (diffInHours > 0) {
      return t('time.hoursAgo', { count: diffInHours });
    } else if (diffInMinutes > 0) {
      return t('time.minutesAgo', { count: diffInMinutes });
    } else {
      return t('time.justNow');
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
              {post.isFromConnection && (
                <View style={[styles.connectionPill, { backgroundColor: COLORS.primary }]}>
                  <Text style={styles.connectionPillText}>Connection</Text>
                </View>
              )}
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
  const [notificationKey, setNotificationKey] = useState(0);
  const [userRadius, setUserRadius] = useState<number | null>(null);
  const [currentUserLocation, setCurrentUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  // Force NotificationBell to re-render when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setNotificationKey(prev => prev + 1);
    }, [])
  );

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let appStateSubscription: any;
    let lastSeenInterval: NodeJS.Timeout;

    const loadUserSettings = async () => {
      try {
        // Load user's radius setting
        const savedRadius = await AsyncStorage.getItem('userLocationRadius');
        if (savedRadius) {
          setUserRadius(parseFloat(savedRadius));
        }

        // Get current user location
        const location = await locationService.getCurrentLocation();
        if (location) {
          setCurrentUserLocation(location);
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };

    const setupAuthListener = async () => {
      try {
        const { getAuth } = await import('../services/firebase');
        const auth = getAuth();

        unsubscribe = auth.onAuthStateChanged((user: any) => {
          if (user) {
            // Initialize location tracking for the authenticated user (with error handling)
            locationService.startLocationTracking().catch((error) => {
              console.log('Location tracking not available:', error);
              // Continue without location tracking
            });

            loadUserSettings();
            loadConnectionPosts();
          } else {
            setLoading(false);
            setPosts([]);
          }
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

        appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

        // Set up interval to update lastSeen every 30 seconds
        lastSeenInterval = setInterval(updateUserLastSeen, 30000);

      } catch (error) {
        console.error('Error setting up auth listener:', error);
        setLoading(false);
      }
    };

    setupAuthListener();

    return () => {
      if (unsubscribe) unsubscribe();
      if (lastSeenInterval) clearInterval(lastSeenInterval);
      if (appStateSubscription) appStateSubscription?.remove();
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

      // Get all public posts (not just from connections)
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

        // Skip current user's own posts
        if (postData.authorId === currentUser.uid) {
          continue;
        }

        // Skip private posts
        if (postData.isPrivate === true) {
          continue;
        }

        // Get author information
        const authorDoc = await getDoc(doc(firestore, 'users', postData.authorId));
        const authorData = authorDoc.exists() ? authorDoc.data() : {};

        // Check if author has location data (always required)
        const authorLat = authorData.location?.latitude;
        const authorLon = authorData.location?.longitude;

        // Skip post if author doesn't have location data
        if (!authorLat || !authorLon) {
          continue;
        }

        // Location-based filtering (if radius is set)
        if (userRadius && currentUserLocation) {
          // Calculate distance between current user and post author
          const distance = calculateDistance(
            currentUserLocation.latitude,
            currentUserLocation.longitude,
            authorLat,
            authorLon
          );

          // Skip post if author is outside the radius
          if (distance > userRadius) {
            continue;
          }
        }

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
          isFromConnection: connectedUserIds.has(postData.authorId),
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

  const filterPostsByLocation = (posts: any[], userLocation: { latitude: number; longitude: number } | null, radiusKm: number) => {
    if (!userLocation || radiusKm === 0) {
      return posts;
    }

    return posts.filter(post => {
      // If post doesn't have location, ignore it
      if (!post.location?.latitude || !post.location?.longitude) {
        return false;
      }

      // If post author doesn't have location, ignore it
      if (!post.authorLocation?.latitude || !post.authorLocation?.longitude) {
        return false;
      }

      // Calculate distance between current user and post author
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        post.authorLocation.latitude,
        post.authorLocation.longitude
      );

      return distance <= radiusKm;
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="newspaper-outline" size={64} color={currentTheme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>{t('feed.noPosts')}</Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
        {t('feed.shareFirst')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{t('feed.title')}</Text>
          <NotificationBell 
            onPress={() => navigation.navigate('Notifications')} 
            color={currentTheme.text}
          />
        </View>
        <FeedSkeleton count={3} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{t('feed.title')}</Text>
        <NotificationBell 
          key={notificationKey}
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
  connectionPill: {
    marginLeft: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  connectionPillText: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
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