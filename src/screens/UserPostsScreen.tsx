import { useState, useEffect, useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { fetchUserProfile, fetchUserPosts, updatePostLike } from '../store/userSlice';
import { useTranslation } from 'react-i18next';
import UserPostsHeader from '../components/UserPostsHeader';
import UserProfileDisplay from '../components/UserProfileDisplay';
import UserPostItem from '../components/UserPostItem';
import UserPostsEmptyState from '../components/UserPostsEmptyState';
import UserPostsSkeleton from '../components/UserPostsSkeleton';
import { styles } from '../styles/UserPostsStyles';
import { getTheme } from '../theme';
import { formatTimeAgo, handlePostLike, loadUserPostsData, refreshUserPostsData } from '../utils/userPostsUtils';

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

export default function UserPostsScreen({ navigation }: any) {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { profile, posts, loading, postsLoading } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  const currentTheme = useMemo(() => getTheme(isDarkMode), [isDarkMode]);

  // Track if we've already attempted to load data to prevent multiple calls
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Simplified load check
  console.log('UserPostsScreen state:', {
    hasAttemptedLoad,
    profile: !!profile,
    postsLength: posts.length,
    loading,
    postsLoading
  });

  // Load data when component mounts
  useEffect(() => {
    if (!hasAttemptedLoad) {
      setHasAttemptedLoad(true);
      loadInitialData();
    }
  }, [hasAttemptedLoad]);

  const loadInitialData = useCallback(async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        // Load profile and posts in parallel for better performance
        await Promise.all([
          dispatch(fetchUserProfile(currentUser.uid)),
          dispatch(fetchUserPosts(currentUser.uid))
        ]);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setHasAttemptedLoad(false); // Reset the flag to allow refresh
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        // Refresh profile and posts in parallel
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
      setHasAttemptedLoad(true); // Set back to true after refresh
    }
  }, [dispatch]);

  const handleLike = useCallback(async (postId: string) => {
    await handlePostLike(postId, posts, (data) => dispatch(updatePostLike(data)));
  }, [posts, dispatch]);

  const handlePostPress = useCallback((post: UserPost) => {
    navigation.navigate('SinglePost', { postId: post.id, isOwnPost: true });
  }, [navigation]);

  const handleSettingsPress = useCallback(() => {
    navigation.navigate('ProfileSettings');
  }, [navigation]);

  const renderPostItem = useCallback(({ item }: { item: UserPost }) => {
    console.log('Rendering post item:', item.id, item.content.substring(0, 50));
    return (
      <UserPostItem
        item={item}
        currentTheme={currentTheme}
        styles={styles}
        onPress={() => handlePostPress(item)}
        onLike={handleLike}
        formatTimeAgo={(date) => formatTimeAgo(date, t)}
      />
    );
  }, [currentTheme, handlePostPress, handleLike, t]);

  const renderProfileHeader = useCallback(() => (
    <UserProfileDisplay
      profile={profile}
      posts={posts}
      currentTheme={currentTheme}
      styles={styles}
    />
  ), [profile, posts, currentTheme]);

  const renderEmptyState = useCallback(() => (
    <UserPostsEmptyState
      currentTheme={currentTheme}
      styles={styles}
    />
  ), [currentTheme]);

  console.log('UserPostsScreen render:', {
    loading,
    postsLoading,
    hasProfile: !!profile,
    postsCount: posts.length,
    hasAttemptedLoad,
    refreshing,
    firstPostId: posts.length > 0 ? posts[0].id : 'none'
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <UserPostsHeader
        currentTheme={currentTheme}
        styles={styles}
        onSettingsPress={handleSettingsPress}
      />

      {loading && !profile ? (
        <UserPostsSkeleton count={5} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPostItem}
          refreshControl={
            <RefreshControl refreshing={refreshing || postsLoading} onRefresh={onRefresh} />
          }
          ListHeaderComponent={renderProfileHeader}
          ListEmptyComponent={postsLoading ? null : renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={false}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
        />
      )}
    </SafeAreaView>
  );
}