import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  AppState,
  ActivityIndicator,
  ViewabilityConfig,
  ViewToken,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../hooks/redux';
import { locationService } from '../services/locationService';
import NotificationBell from '../components/NotificationBell';
import FeedSkeleton from '../components/FeedSkeleton';
import PostItem from '../components/PostItem';
import EmptyFeedState from '../components/EmptyFeedState';
import { useTranslation } from 'react-i18next';
import { 
  updateUserLastSeen, 
  loadUserSettings, 
  handleLikePost,
  loadConnectionPosts 
} from '../utils/feedUtils';
import { feedStyles } from '../styles/FeedStyles';
import { getTheme } from '../theme';
import { 
  doc, 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  addDoc 
} from 'firebase/firestore';

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

export default function FeedScreen({ navigation }: any) {
  const [posts, setPosts] = useState<ConnectionPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [lastPostTimestamp, setLastPostTimestamp] = useState<Date | null>(null);
  const [notificationKey, setNotificationKey] = useState(0);
  const [userRadius, setUserRadius] = useState<number | null>(null);
  const [currentUserLocation, setCurrentUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [currentlyPlayingVideo, setCurrentlyPlayingVideo] = useState<string | null>(null);
  const [videoMutedStates, setVideoMutedStates] = useState<{[key: string]: boolean}>({});
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList>(null);

  const currentTheme = getTheme(isDarkMode);

  const viewabilityConfig: ViewabilityConfig = {
    viewAreaCoveragePercentThreshold: 70, // Video needs to be 70% visible to autoplay
    minimumViewTime: 200, // Must be visible for at least 200ms to avoid flicker
    waitForInteraction: false,
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    // Find the first viewable video post with at least 70% visibility
    const visibleVideoPosts = viewableItems.filter(item => 
      item.item?.mediaType === 'video' && 
      item.isViewable && 
      (item.percentVisible || 0) >= 70
    );

    if (visibleVideoPosts.length > 0) {
      // Play the first fully visible video
      const mostVisibleVideo = visibleVideoPosts.reduce((prev, current) => 
        (current.percentVisible || 0) > (prev.percentVisible || 0) ? current : prev
      );
      
      if (mostVisibleVideo.item.id !== currentlyPlayingVideo) {
        setCurrentlyPlayingVideo(mostVisibleVideo.item.id);
      }
    } else {
      // No video posts are sufficiently visible, stop all playback
      setCurrentlyPlayingVideo(null);
    }
  }, [currentlyPlayingVideo]);

  const handleVideoMuteToggle = useCallback((postId: string) => {
    setVideoMutedStates(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  }, []);

  // Force NotificationBell to re-render when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setNotificationKey(prev => prev + 1);
    }, [])
  );

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let appStateSubscription: any;
    let lastSeenInterval: NodeJS.Timeout | number;

    const initializeAndSetupAuth = async () => {
      try {
        // Ensure Firebase is initialized first
        const { initializeFirebase, getAuth } = await import('../services/firebase');

        // Initialize Firebase if not already done
        await initializeFirebase();

        const auth = getAuth();

        unsubscribe = auth.onAuthStateChanged(async (user: any) => {
          if (user) {
            try {
              // Load user settings and location first
              const radius = await loadUserSettings();
              if (radius) {
                setUserRadius(radius);
              }

              // Get current user location (continue even if it fails)
              try {
                const location = await locationService.getCurrentLocation();
                if (location) {
                  setCurrentUserLocation(location);
                }
              } catch (locationError) {
                console.log('Location service not available:', locationError);
                // Continue without location - posts will still load
              }

              // Initialize location tracking for the authenticated user (with error handling)
              setTimeout(() => {
                locationService.startLocationTracking().catch((error) => {
                  console.log('Location tracking not available:', error);
                  // Continue without location tracking
                });
              }, 1000);

              // Load posts after everything is set up
              await loadPosts();
            } catch (error) {
              console.error('Error during user initialization:', error);
              setLoading(false);
            }
          } else {
            setLoading(false);
            setPosts([]);
          }
        });

        // Handle app state changes to update lastSeen
        const handleAppStateChange = (nextAppState: string) => {
          if (nextAppState === 'active') {
            updateUserLastSeen().catch(console.error);
          } else if (nextAppState === 'background' || nextAppState === 'inactive') {
            // Update lastSeen when app goes to background to show user as offline
            updateUserLastSeen().catch(console.error);
          }
        };

        appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

        // Set up interval to update lastSeen every 30 seconds
        lastSeenInterval = setInterval(() => {
          updateUserLastSeen().catch(console.error);
        }, 30000);

      } catch (error) {
        console.error('Error initializing Firebase or setting up auth listener:', error);
        setLoading(false);
      }
    };

    initializeAndSetupAuth();

    return () => {
      if (unsubscribe) unsubscribe();
      if (lastSeenInterval) clearInterval(lastSeenInterval);
      if (appStateSubscription) appStateSubscription?.remove();
    };
  }, []);



  const loadPosts = async (isRefresh = false) => {
    let timeout: NodeJS.Timeout | number | undefined;

    try {
      if (isRefresh) {
        setRefreshing(true);
        setLastPostTimestamp(null);
        setHasMorePosts(true);
      } else {
        setLoading(true);
      }

      const connectionPosts = await loadConnectionPosts(
        userRadius, 
        currentUserLocation, 
        null, // lastTimestamp for initial load
        10 // limit - fetch 10 posts initially
      );

      if (isRefresh) {
        setPosts(connectionPosts);
      } else {
        setPosts(connectionPosts);
      }

      // Set the last post timestamp for pagination
      if (connectionPosts.length > 0) {
        setLastPostTimestamp(connectionPosts[connectionPosts.length - 1].createdAt);
      }

      // Check if we have more posts
      setHasMorePosts(connectionPosts.length === 10);

      if (timeout) clearTimeout(timeout);
    } catch (error) {
      console.error('Error loading posts:', error);
      if (timeout) clearTimeout(timeout);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadMorePosts = async () => {
    console.log('loadMorePosts called:', { loadingMore, hasMorePosts, lastPostTimestamp });

    if (loadingMore || !hasMorePosts || !lastPostTimestamp) {
      console.log('Skipping loadMorePosts:', { loadingMore, hasMorePosts, lastPostTimestamp });
      return;
    }

    try {
      console.log('Loading more posts...');
      setLoadingMore(true);

      const morePosts = await loadConnectionPosts(
        userRadius,
        currentUserLocation,
        lastPostTimestamp,
        10 // Load 10 more posts
      );

      console.log('Loaded more posts:', morePosts.length);

      if (morePosts.length > 0) {
        setPosts(prevPosts => {
          const newPosts = [...prevPosts, ...morePosts];
          console.log('Total posts after loading more:', newPosts.length);
          return newPosts;
        });
        setLastPostTimestamp(morePosts[morePosts.length - 1].createdAt);
        setHasMorePosts(morePosts.length === 10);
      } else {
        console.log('No more posts to load');
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    await loadPosts(true);
  };

  const handleLike = async (postId: string, currentLiked: boolean) => {
    try {
      // Get firebase instances
      const { getFirestore, getAuth } = await import('../services/firebase');
      const firestore = getFirestore();
      const auth = getAuth();
      const user = auth.currentUser;

      // Optimistically update UI first
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLikedByUser: !currentLiked,
              likesCount: currentLiked ? post.likesCount - 1 : post.likesCount + 1
            }
          : post
      ));

      const postRef = doc(firestore, 'posts', postId);
      const likesCollectionRef = collection(postRef, 'likes');

      if (currentLiked) {
        // Unlike: remove the like document
        const userLikeQuery = query(likesCollectionRef, where('authorId', '==', user?.uid));
        const userLikeSnapshot = await getDocs(userLikeQuery);

        if (!userLikeSnapshot.empty) {
          await deleteDoc(userLikeSnapshot.docs[0].ref);
        }
      } else {
        // Like: add a like document
        await addDoc(likesCollectionRef, {
          authorId: user?.uid,
          authorName: user?.displayName || 'Anonymous',
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error updating like:', error);
      // Revert optimistic update on error
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLikedByUser: currentLiked,
              likesCount: currentLiked ? post.likesCount + 1 : post.likesCount - 1
            }
          : post
      ));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[feedStyles.container, { backgroundColor: currentTheme.background }]}>
        <View style={[feedStyles.header, { borderBottomColor: currentTheme.border }]}>
          <Text style={[feedStyles.headerTitle, { color: currentTheme.text }]}>{t('feed.title')}</Text>
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
    <SafeAreaView style={[feedStyles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[feedStyles.header, { borderBottomColor: currentTheme.border }]}>
        <Text style={[feedStyles.headerTitle, { color: currentTheme.text }]}>{t('feed.title')}</Text>
        <NotificationBell 
          key={notificationKey}
          onPress={() => navigation.navigate('Notifications')} 
          color={currentTheme.text}
        />
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostItem
              post={item}
              onLike={handleLike}
              currentTheme={currentTheme}
              navigation={navigation}
              showImageBorderRadius={false}
              isVideoPlaying={item.mediaType === 'video' && currentlyPlayingVideo === item.id}
              isVideoMuted={videoMutedStates[item.id] || false}
              onVideoMuteToggle={() => handleVideoMuteToggle(item.id)}
            />
          )}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={currentTheme.primary}
              colors={[currentTheme.primary]}
              progressBackgroundColor={currentTheme.background}
            />
          }
          ListEmptyComponent={<EmptyFeedState currentTheme={currentTheme} />}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={currentTheme.primary} />
              </View>
            ) : null
          }
          onEndReached={loadMorePosts}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          removeClippedSubviews={false}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={10}
        />
      </View>
    </SafeAreaView>
  );
}