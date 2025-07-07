import { useState, useEffect } from 'react';
import { FlatList, RefreshControl, Alert, Image, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { fetchUserProfile, fetchUserPosts, updatePostLike } from '../store/userSlice';
import { useDataRefresh } from '../hooks/useDataRefresh';
import { useTranslation } from 'react-i18next';

import UserPostsEmptyState from '../components/UserPostsEmptyState';
import UserPostsSkeleton from '../components/UserPostsSkeleton';
import UserPostsGridItem from '../components/UserPostsGridItem';
import { styles } from '../styles/UserPostsStyles';
import { getTheme } from '../theme';
import { formatTimeAgo, handlePostLike, loadUserPostsData, refreshUserPostsData } from '../utils/userPostsUtils';
import UserPostsProfileDisplay from '../components/UserPostsProfileDisplay';
import DeletePostConfirmationModal from '../components/DeletePostConfirmationModal';
import SuccessModal from '../components/SuccessModal';

const { width } = Dimensions.get('window');

interface UserPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  mediaURL?: string;
  thumbnailURL?: string;
  mediaType?: 'image' | 'video';
  createdAt: Date | string;
  likesCount: number;
  commentsCount: number;
  showLikeCount: boolean;
  allowComments: boolean;
  isPrivate: boolean;
  isLikedByUser?: boolean;
}

export default function UserPostsScreen({ route, navigation }: any) {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { profile, posts = [], postsLoading, lastProfileFetch, lastPostsFetch } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<UserPost | null>(null);

  const currentTheme = getTheme(isDarkMode);

  // Check if we should refetch due to new post creation
  const shouldRefetchAfterNewPost = route?.params?.refetchAfterNewPost;

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
    refreshThreshold: shouldRefetchAfterNewPost ? 0 : 5 * 60 * 1000 // Always refresh if coming from new post, otherwise 5 minutes
  });

  // Clear the refetch parameter after using it
  useEffect(() => {
    if (shouldRefetchAfterNewPost) {
      // Reset the navigation params to prevent unnecessary refetches
      navigation.setParams({ refetchAfterNewPost: undefined });
    }
  }, [shouldRefetchAfterNewPost, navigation]);

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

  const handleConnectionsPress = () => {
    navigation.navigate('Connections');
  };

  const handleDeletePost = (post: UserPost) => {
    setSelectedPost(post);
    setShowDeleteModal(true);
  };

  const confirmDeletePost = async () => {
    if (!selectedPost) return;

    try {
      const { getAuth, getFirestore } = await import('../services/firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');

      const auth = getAuth();
      const firestore = getFirestore();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      // Delete the post
      await deleteDoc(doc(firestore, 'posts', selectedPost.id));

      // Update local state (assuming 'posts' is the correct state variable)
      dispatch(fetchUserPosts(currentUser.uid));

      setShowDeleteModal(false);
      setShowDeleteSuccessModal(true);
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete post');
      setShowDeleteModal(false);
    }
    setSelectedPost(null);
  };

  const handleDeleteSuccessClose = () => {
    setShowDeleteSuccessModal(false);
  };

  const renderPostItem = ({ item, index }: { item: UserPost; index: number }) => {
    return (
      <UserPostsGridItem
        item={item}
        index={index}
        onPress={handlePostPress}
        currentTheme={currentTheme}
        styles={styles}
        onDelete={handleDeletePost}
      />
    );
  };

  const renderProfileHeader = () => (
    <UserPostsProfileDisplay
      profile={profile}
      posts={posts}
      currentTheme={currentTheme}
      styles={styles}
      onConnectionsPress={handleConnectionsPress}
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
            numColumns={3}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListHeaderComponent={renderProfileHeader}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={styles.gridRow}
          />
        </>
      )}

      <DeletePostConfirmationModal
        visible={showDeleteModal}
        onConfirm={confirmDeletePost}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedPost(null);
        }}
        currentTheme={currentTheme}
      />

      <SuccessModal
        visible={showDeleteSuccessModal}
        title={t('userPosts.postDeleted', 'Post Deleted')}
        message={t('userPosts.postDeletedMessage', 'The post has been successfully deleted.')}
        onClose={handleDeleteSuccessClose}
        currentTheme={currentTheme}
      />
    </SafeAreaView>
  );
}