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
  isFrontCamera?: boolean;
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  const [notificationKey, setNotificationKey] = useState(0);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [rememberedVideoId, setRememberedVideoId] = useState<string | null>(null);
  const [userRadius, setUserRadius] = useState<number>(10);
  const [currentUserLocation, setCurrentUserLocation] = useState<any>(null);
  const [lastPostTimestamp, setLastPostTimestamp] = useState<Date | null>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
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
    // Don't start videos if the screen is not focused
    if (!isScreenFocused) {
      return;
    }

    // Find the first viewable video post with at least 70% visibility
    const visibleVideoPosts = viewableItems.filter(item => 
      item.item && 
      item.item.mediaType === 'video' && 
      item.isViewable && 
      (item.percentVisible ?? 100) >= 70
    );

    console.log('Viewable items changed:', {
      totalViewable: viewableItems.length,
      videoCount: visibleVideoPosts.length,
      currentlyPlaying: playingVideoId,
      visibleVideos: visibleVideoPosts.map(v => ({ id: v.item.id, percent: v.percentVisible, mediaType: v.item.mediaType })),
      allItems: viewableItems.map(v => ({ id: v.item?.id, mediaType: v.item?.mediaType, isViewable: v.isViewable, percent: v.percentVisible }))
    });

    if (visibleVideoPosts.length > 0) {
      // Play the first fully visible video
      const mostVisibleVideo = visibleVideoPosts.reduce((prev, current) => 
        (current.percentVisible || 0) > (prev.percentVisible || 0) ? current : prev
      );

      if (mostVisibleVideo.item.id !== playingVideoId) {
        console.log('Setting playing video to:', mostVisibleVideo.item.id);
        setPlayingVideoId(mostVisibleVideo.item.id);
      }
    } else {
      // No video posts are sufficiently visible, stop all playback
      if (playingVideoId) {
        console.log('Stopping video playback');
        setPlayingVideoId(null);
      }
    }
  }, [playingVideoId, isScreenFocused]);

  const handleVideoMuteToggle = useCallback((postId: string) => {
    setMutedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  }, []);

  const handleVideoPlayPauseToggle = useCallback((postId: string, shouldPlay: boolean) => {
    if (shouldPlay) {
      console.log('Manually starting video:', postId);
      setPlayingVideoId(postId);
    } else {
      console.log('Manually pausing video:', postId);
      setPlayingVideoId(null);
    }
  }, []);

  // Force NotificationBell to re-render when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setNotificationKey(prev => prev + 1);
    }, [])
  );

  // Pause videos when screen loses focus and resume when focused
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);

      // Screen is focused - restore previously playing video if it exists
      if (rememberedVideoId && posts.length > 0) {
        // Check if the remembered video is still in the posts array
        const videoStillExists = posts.some(post => post.id === rememberedVideoId && post.mediaType === 'video');
        if (videoStillExists) {
          console.log('Restoring previously playing video:', rememberedVideoId);
          setPlayingVideoId(rememberedVideoId);
          setRememberedVideoId(null); // Clear the remembered video
        } else {
          setRememberedVideoId(null); // Clear if video no longer exists
        }
      }

      return () => {
        // Screen is losing focus - remember currently playing video and pause it
        // Use a ref to get current value without adding to dependencies
        setRememberedVideoId(prev => {
          const currentPlayingId = playingVideoId;
          if (currentPlayingId) {
            console.log('Remembering playing video for restoration:', currentPlayingId);
            return currentPlayingId;
          }
          return prev;
        });
        setPlayingVideoId(null);
        setIsScreenFocused(false);
      };
    }, [rememberedVideoId, posts.length])
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
      
      // Debug log posts data
      console.log('FeedScreen - RAW FETCHED POSTS FROM loadConnectionPosts:');
      console.log('='.repeat(80));
      console.log('Total posts fetched:', connectionPosts.length);
      connectionPosts.forEach((post, index) => {
        console.log(`RAW POST ${index + 1}:`, {
          id: post.id,
          authorId: post.authorId,
          authorName: post.authorName,
          authorPhotoURL: post.authorPhotoURL,
          content: post.content?.substring(0, 100) + (post.content && post.content.length > 100 ? '...' : ''),
          mediaURL: post.mediaURL ? 'HAS_MEDIA_URL' : 'NO_MEDIA_URL',
          mediaType: post.mediaType,
          isFrontCamera: post.isFrontCamera,
          createdAt: post.createdAt,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          showLikeCount: post.showLikeCount,
          allowComments: post.allowComments,
          isLikedByUser: post.isLikedByUser,
          isAuthorOnline: post.isAuthorOnline,
          isFromConnection: post.isFromConnection
        });
      });
      console.log('='.repeat(80));

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

  const handleLike = async (postId: string, newLikedState: boolean) => {
    const { getFirestore, getAuth } = await import('../services/firebase');
    const firestore = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return;

    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) return;

    const currentLiked = currentPost.isLikedByUser;

    // Don't process if the state is already what we want
    if (currentLiked === newLikedState) return;

    // Optimistic update
    setPosts(prevPosts => prevPosts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLikedByUser: newLikedState,
            likesCount: newLikedState ? post.likesCount + 1 : post.likesCount - 1
          }
        : post
    ));

    try {
      const likesCollectionRef = collection(firestore, 'posts', postId, 'likes');

      if (newLikedState) {
        // Like: add a like document
        await addDoc(likesCollectionRef, {
          authorId: user?.uid,
          authorName: user?.displayName || 'Anonymous',
          createdAt: new Date(),
        });
        console.log('FeedScreen - Successfully added like to Firebase');
      } else {
        // Unlike: remove the like document
        const userLikeQuery = query(likesCollectionRef, where('authorId', '==', user?.uid));
        const userLikeSnapshot = await getDocs(userLikeQuery);

        if (!userLikeSnapshot.empty) {
          const likeDoc = userLikeSnapshot.docs[0];
          await deleteDoc(likeDoc.ref);
          console.log('FeedScreen - Successfully removed like from Firebase');
        } else {
          console.log('FeedScreen - No like document found to remove');
        }
      }
    } catch (error) {
      console.error('FeedScreen - Error handling like:', error);

      // Revert optimistic update on error
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLikedByUser: currentLiked,
              likesCount: currentPost.likesCount
            }
          : post
      ));
    }
  };

  const handlePostLike = async (postId: string, currentlyLiked: boolean) => {
    try {
      const result = await handleLikePost(postId, !currentlyLiked, posts);
      if (result) {
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  isLikedByUser: !currentlyLiked,
                  likesCount: currentlyLiked ? post.likesCount - 1 : post.likesCount + 1
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error handling post like:', error);
    }
  };

  const handleCommentsCountChange = (postId: string, newCount: number) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, commentsCount: newCount }
          : post
      )
    );
  };

  const handleVideoVisibilityChange = (postId: string, isVisible: boolean) => {
    if (isVisible) {
      setPlayingVideoId(postId);
    } else if (playingVideoId === postId) {
      setPlayingVideoId(null);
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
              key={item.id}
              post={item}
              onLike={handlePostLike}
              currentTheme={currentTheme}
              navigation={navigation}
              showImageBorderRadius={false}
              isVideoPlaying={playingVideoId === item.id}
              isVideoMuted={mutedVideos.has(item.id)}
              onVideoMuteToggle={handleVideoMuteToggle}
              onVideoPlayPauseToggle={handleVideoPlayPauseToggle}
              onCommentsCountChange={handleCommentsCountChange}
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