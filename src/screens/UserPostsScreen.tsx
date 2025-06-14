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
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { collection, getDocs, doc, getDoc, query, orderBy, where, addDoc, deleteDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import SkeletonLoader from '../components/SkeletonLoader';
import UserPostsSkeleton from '../components/UserPostsSkeleton';
import { useTranslation } from 'react-i18next';
import { fetchUserProfile, fetchUserPosts, updatePostLike } from '../store/userSlice';

interface UserPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  mediaURL?: string;
  mediaType?: 'image' | 'video';
  createdAt: Date | string;
  likesCount: number;
  commentsCount: number;
  showLikeCount: boolean;
  allowComments: boolean;
  isPrivate: boolean;
  isLikedByUser?: boolean;
}

const AvatarImage = ({ source, style, ...props }: { source: any; style: any; [key: string]: any }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Get proper width value for shimmer effect
  const imageWidth = typeof style?.width === 'number' ? style.width : 40;
  const imageHeight = typeof style?.height === 'number' ? style.height : 40;

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [source?.uri]);

  return (
    <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
      {loading && !error && (
        <SkeletonLoader
          width={imageWidth}
          height={imageHeight}
          borderRadius={style?.borderRadius || 20}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
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
        {...props}
      />
    </View>
  );
};

const PostImage = ({ source, style, ...props }: { source: any; style: any; [key: string]: any }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Get the actual width from Dimensions since style width might be '100%'
  const { width } = Dimensions.get('window');
  const imageWidth = width - (SPACING.md * 4); // Account for padding
  const imageHeight = typeof style?.height === 'number' ? style.height : 200;

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [source?.uri]);

  return (
    <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
      {loading && !error && (
        <SkeletonLoader
          width={imageWidth}
          height={imageHeight}
          borderRadius={style?.borderRadius || 8}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
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
        resizeMode='cover'
        {...props}
      />
    </View>
  );
};

export default function UserPostsScreen({ navigation }: any) {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { profile, posts, loading, postsLoading } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  // Load data only once when component mounts or when explicitly refreshed
  useEffect(() => {
    // Only load if we don't have data or if it's been more than 5 minutes
    const shouldLoad = !profile || 
                      posts.length === 0 || 
                      (profile && Date.now() - profile.lastUpdated > 300000);
    
    if (shouldLoad) {
      loadInitialData();
    }
  }, []);

  const loadInitialData = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        console.log('Loading posts for user:', currentUser.uid);
        // Always fetch profile and posts on focus
        const profileResult = await dispatch(fetchUserProfile(currentUser.uid));
        const postsResult = await dispatch(fetchUserPosts(currentUser.uid));
        
        console.log('Profile result:', profileResult);
        console.log('Posts result:', postsResult);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        // Force refresh both profile and posts data
        await Promise.all([
          dispatch(fetchUserProfile(currentUser.uid)).unwrap(),
          dispatch(fetchUserPosts(currentUser.uid)).unwrap()
        ]);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
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
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.isLikedByUser) {
        // Unlike: Find and delete the user's like
        const likesSnapshot = await getDocs(likesCollection);
        let userLikeDoc : any = null;

        likesSnapshot.forEach((likeDoc) => {
          if (likeDoc.data().authorId === currentUser.uid) {
            userLikeDoc = likeDoc;
          }
        });

        if (userLikeDoc) {
          await deleteDoc(doc(firestore, 'posts', postId, 'likes', userLikeDoc.id));
        }

        // Update Redux state
        dispatch(updatePostLike({ postId, isLiked: false }));
      } else {
        // Like: Add new like
        await addDoc(likesCollection, {
          authorId: currentUser.uid,
          createdAt: new Date(),
        });

        // Update Redux state
        dispatch(updatePostLike({ postId, isLiked: true }));
      }
    } catch (error) {
      console.error('Error handling like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handlePostPress = (post: UserPost) => {
    navigation.navigate('SinglePost', { postId: post.id, isOwnPost: true });
  };

  const formatTimeAgo = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
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

  const renderPostItem = ({ item }: { item: UserPost }) => {
    console.log('Rendering post item:', item.id, item.content);
    return (
    <TouchableOpacity
      style={[styles.postItem, { backgroundColor: currentTheme.surface }]}
      onPress={() => handlePostPress(item)}
    >
      <View style={styles.postHeader}>
        <View style={styles.postAuthorInfo}>
          {item.authorPhotoURL ? (
            <AvatarImage
              source={{ uri: item.authorPhotoURL }}
              style={styles.postAuthorAvatar}
            />
          ) : (
            <View style={[styles.postAuthorAvatar, styles.postAuthorAvatarPlaceholder, { backgroundColor: currentTheme.border }]}>
              <Ionicons name="person" size={20} color={currentTheme.textSecondary} />
            </View>
          )}
          <View>
            <Text style={[styles.postAuthorName, { color: currentTheme.text }]}>
              {item.authorName}
            </Text>
            <View style={styles.postMetaInfo}>
              <Text style={[styles.postTime, { color: currentTheme.textSecondary }]}>
                {formatTimeAgo(item.createdAt)}
              </Text>
              {item.isPrivate && (
                <View style={styles.privateIndicator}>
                  <Ionicons name="lock-closed" size={12} color={currentTheme.textSecondary} />
                  <Text style={[styles.privateText, { color: currentTheme.textSecondary }]}>{t('addPost.private', 'Private')}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {item.content ? (
        <Text style={[styles.postContent, { color: currentTheme.text }]} numberOfLines={3}>
          {item.content}
        </Text>
      ) : null}

      {item.mediaURL && (
        <View style={{ marginBottom: SPACING.sm }}>
          <PostImage
            source={{ uri: item.mediaURL }}
            style={styles.postMedia}
          />
        </View>
      )}

      <View style={styles.postStats}>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => handleLike(item.id)}
        >
          <Ionicons 
            name={item.isLikedByUser ? "heart" : "heart-outline"} 
            size={16} 
            color={item.isLikedByUser ? COLORS.error : currentTheme.textSecondary} 
          />
          <Text style={[styles.statText, { color: currentTheme.textSecondary }]}>
            {item.likesCount}
          </Text>
        </TouchableOpacity>
        {item.allowComments && (
          <TouchableOpacity style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={16} color={currentTheme.textSecondary} />
            <Text style={[styles.statText, { color: currentTheme.textSecondary }]}>
              {item.commentsCount}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { minHeight: 300 }]}>
      <Ionicons
        name="document-text-outline"
        size={64}
        color={currentTheme.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
        {t('profile.noPosts')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
        {t('profile.shareFirst')}
      </Text>
    </View>
  );

  const renderProfileHeader = () => (
    <View style={[styles.profileHeader, { backgroundColor: currentTheme.surface }]}>
      <View style={styles.profileRow}>
        {(profile?.thumbnailURL || profile?.photoURL) && (profile.thumbnailURL || profile.photoURL).trim() !== '' ? (
          <AvatarImage
            source={{ 
              uri: profile.thumbnailURL || profile.photoURL,
              cache: 'reload'
            }} 
            style={styles.smallAvatar}
            key={`${profile.thumbnailURL || profile.photoURL}-${profile?.lastUpdated}`}
          />
        ) : (
          <View style={[styles.smallAvatar, styles.placeholderAvatar, { backgroundColor: currentTheme.border }]}>
            <Ionicons name="person" size={24} color={currentTheme.textSecondary} />
          </View>
        )}

        <View style={styles.profileInfo}>
          <Text style={[styles.displayName, { color: currentTheme.text }]}>
            {profile?.firstName && profile?.lastName 
              ? `${profile.firstName} ${profile.lastName}` 
              : t('profile.yourProfile', 'Your Profile')}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: currentTheme.text }]}>
                {profile?.postsCount || posts?.length || 0}
              </Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                {t('profile.posts')}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: currentTheme.text }]}>
                {profile?.connectionsCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                {t('profile.connections')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
          {t('profile.myPosts')}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileSettings')}>
          <Ionicons name="settings-outline" size={24} color={currentTheme.text} />
        </TouchableOpacity>
      </View>

      {(loading || postsLoading) ? (
        <UserPostsSkeleton count={5} />
      ) : (
        <>
          {console.log('Posts array in render:', posts.length, posts)}
          <FlatList
            data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPostItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={renderProfileHeader}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          />
        </>
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
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  profileHeader: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SPACING.md,
  },
  placeholderAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  stat: {
    alignItems: 'center',
    marginRight: SPACING.xl,
  },
  statNumber: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
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
  postMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postTime: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  privateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  privateText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.xs,
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
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
});