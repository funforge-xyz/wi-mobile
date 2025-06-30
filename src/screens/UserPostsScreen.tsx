import { useState, useEffect } from 'react';
import { FlatList, RefreshControl, Alert, Image, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { fetchUserProfile, fetchUserPosts, updatePostLike } from '../store/userSlice';
import { useDataRefresh } from '../hooks/useDataRefresh';
import { useTranslation } from 'react-i18next';

import UserPostItem from '../components/UserPostItem';
import UserPostsEmptyState from '../components/UserPostsEmptyState';
import UserPostsSkeleton from '../components/UserPostsSkeleton';
import { styles } from '../styles/UserPostsStyles';
import { getTheme } from '../theme';
import { formatTimeAgo, handlePostLike, loadUserPostsData, refreshUserPostsData } from '../utils/userPostsUtils';
import UserPostsProfileDisplay from '../components/UserPostsProfileDisplay';

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
  const { profile, posts = [], postsLoading, lastProfileFetch, lastPostsFetch } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  const currentTheme = getTheme(isDarkMode);

  // Use data refresh hook to automatically refresh when screen is focused
  const loadInitialData = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        await Promise.all([
          dispatch(fetchUserProfile(currentUser.uid)),
          dispatch(fetchUserPosts(currentUser.uid))
        ]);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  useDataRefresh({
    fetchData: loadInitialData,
    lastFetch: Math.max(lastProfileFetch, lastPostsFetch),
    refreshThreshold: 5 * 60 * 1000 // 5 minutes
  });

  // Listen for auth state changes to load fresh data for new user
  useEffect(() => {
    const setupAuthListener = async () => {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          // User logged in, load fresh data
          loadInitialData();
        }
      });

      return unsubscribe;
    };

    let unsubscribe: (() => void) | null = null;
    setupAuthListener().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

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
    <UserPostsProfileDisplay
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
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
          {t('profile.myPosts')}
        </Text>
        <TouchableOpacity onPress={handleSettingsPress}>
          <Ionicons name="settings-outline" size={24} color={currentTheme.text} />
        </TouchableOpacity>
      </View>

      {postsLoading ? (
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