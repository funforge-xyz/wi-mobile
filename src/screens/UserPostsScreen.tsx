import { useState, useEffect } from 'react';
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
import { lightTheme, darkTheme, styles } from '../styles/UserPostsStyles';
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

      await loadUserPostsData(dispatch, currentUser, fetchUserProfile, fetchUserPosts);
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

      await refreshUserPostsData(dispatch, currentUser);
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLike = async (postId: string) => {
    await handlePostLike(postId, posts, (data) => dispatch(updatePostLike(data)));
  };

  const handlePostPress = (post: UserPost) => {
    navigation.navigate('SinglePost', { postId: post.id, isOwnPost: true });
  };

  const handleSettingsPress = () => {
    navigation.navigate('ProfileSettings');
  };

  const renderPostItem = ({ item }: { item: UserPost }) => {
    console.log('Rendering post item:', item.id, item.content);
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
  };

  const renderProfileHeader = () => (
    <UserProfileDisplay
      profile={profile}
      posts={posts}
      currentTheme={currentTheme}
      styles={styles}
    />
  );

  const renderEmptyState = () => (
    <UserPostsEmptyState
      currentTheme={currentTheme}
      styles={styles}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <UserPostsHeader
        currentTheme={currentTheme}
        styles={styles}
        onSettingsPress={handleSettingsPress}
      />

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