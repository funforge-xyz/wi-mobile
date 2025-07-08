
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  RefreshControl,
  AppState,
  ActivityIndicator,
  ViewabilityConfig,
  ViewToken,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList } from 'react-native-gesture-handler';
import { useAppSelector } from '../hooks/redux';
import { locationService } from '../services/locationService';
import NotificationBell from '../components/NotificationBell';
import FeedSkeleton from '../components/FeedSkeleton';
import PostMedia from '../components/PostMedia';
import EmptyFeedState from '../components/EmptyFeedState';
import PostDetailsModal from '../components/PostDetailsModal';
import UserAvatar from '../components/UserAvatar';
import { useTranslation } from 'react-i18next';
import { 
  updateUserLastSeen, 
  loadUserSettings, 
  handleLikePost,
  loadConnectionPosts 
} from '../utils/feedUtils';
import { getTheme } from '../theme';
import { 
  doc, 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  addDoc ,
  updateDoc,
  increment,
  getDoc
} from 'firebase/firestore';
import { getFirestore, getAuth } from '../services/firebase';

const { width, height } = Dimensions.get('window');

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
  const [showPostDetailsModal, setShowPostDetailsModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [notificationKey, setNotificationKey] = useState(0);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [rememberedVideoId, setRememberedVideoId] = useState<string | null>(null);
  const [userRadius, setUserRadius] = useState<number>(10);
  const [currentUserLocation, setCurrentUserLocation] = useState<any>(null);
  const [lastPostTimestamp, setLastPostTimestamp] = useState<Date | null>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList>(null);

  const currentTheme = getTheme(isDarkMode);

  const viewabilityConfig: ViewabilityConfig = {
    viewAreaCoveragePercentThreshold: 80,
    minimumViewTime: 300,
    waitForInteraction: false,
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (!isScreenFocused || viewableItems.length === 0) {
      return;
    }

    const visibleItem = viewableItems[0];
    if (visibleItem && visibleItem.item) {
      const post = visibleItem.item;
      setCurrentIndex(visibleItem.index || 0);
      
      // Auto-play videos when they become visible
      if (post.mediaType === 'video' && post.id !== playingVideoId) {
        setPlayingVideoId(post.id);
      } else if (post.mediaType === 'image' && playingVideoId) {
        setPlayingVideoId(null);
      }
    }
  }, [playingVideoId, isScreenFocused]);

  const onScrollToIndexFailed = (info: any) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
    });
  };

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

      if (rememberedVideoId && posts.length > 0) {
        const videoStillExists = posts.some(post => post.id === rememberedVideoId && post.mediaType === 'video');
        if (videoStillExists) {
          setPlayingVideoId(rememberedVideoId);
          setRememberedVideoId(null);
        } else {
          setRememberedVideoId(null);
        }
      }

      return () => {
        setRememberedVideoId(prev => {
          const currentPlayingId = playingVideoId;
          if (currentPlayingId) {
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
        const { initializeFirebase, getAuth } = await import('../services/firebase');

        console.log('FeedScreen: Initializing Firebase...');
        await initializeFirebase();
        console.log('FeedScreen: Firebase initialized successfully');

        const auth = getAuth();

        unsubscribe = auth.onAuthStateChanged(async (user: any) => {
          if (user) {
            try {
              await user.reload();

              const currentUser = auth.currentUser;
              if (!currentUser) {
                console.log('User not found after reload');
                setLoading(false);
                setPosts([]);
                return;
              }

              const radius = await loadUserSettings();
              if (radius) {
                setUserRadius(radius);
              }

              let location = null;
              try {
                console.log('FeedScreen: Getting user location...');
                location = await Promise.race([
                  locationService.getCurrentLocation(),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Location timeout')), 10000)
                  )
                ]);
                console.log('FeedScreen: Location obtained:', location);
                setCurrentUserLocation(location);
              } catch (locationError) {
                console.log('FeedScreen: Location service not available:', locationError);
                setLoading(false);
                return;
              }

              setTimeout(() => {
                locationService.startLocationTracking().catch((error) => {
                  console.log('Location tracking not available:', error);
                });
              }, 1000);

              console.log('FeedScreen: Loading posts...');
              await loadPosts();
            } catch (error) {
              console.error('Error during user initialization:', error);
              setLoading(false);
            }
          } else {
            console.log('No authenticated user found');
            setLoading(false);
            setPosts([]);
          }
        });

        const handleAppStateChange = (nextAppState: string) => {
          if (nextAppState === 'active') {
            updateUserLastSeen().catch(console.error);
          } else if (nextAppState === 'background' || nextAppState === 'inactive') {
            updateUserLastSeen().catch(console.error);
          }
        };

        appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

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
    console.log('loadPosts called:', { isRefresh, currentUserLocation, userRadius });

    const effectiveRadius = currentUserLocation ? userRadius : 0;
    const effectiveLocation = currentUserLocation || { latitude: 0, longitude: 0 };

    const { getAuth } = await import('../services/firebase');
    const auth = getAuth();
    if (!auth.currentUser) {
      console.log('User not authenticated, skipping post loading');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    console.log('Loading posts:', { isRefresh, currentUserLocation });

    let timeout: NodeJS.Timeout;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      timeout = setTimeout(() => {
        console.log('Loading timeout - resetting loading state');
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }, 15000);

      const connectionPosts = await loadConnectionPosts(
        effectiveRadius, 
        effectiveLocation, 
        null,
        10
      );

      console.log('FeedScreen - RAW FETCHED POSTS FROM loadConnectionPosts:');
      console.log('='.repeat(80));
      console.log('Total posts fetched:', connectionPosts.length);

      if (isRefresh) {
        setPosts(connectionPosts);
      } else {
        setPosts(connectionPosts);
      }

      if (connectionPosts.length > 0) {
        setLastPostTimestamp(connectionPosts[connectionPosts.length - 1].createdAt);
      }

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

      const effectiveRadius = currentUserLocation ? userRadius : 0;
      const effectiveLocation = currentUserLocation || { latitude: 0, longitude: 0 };
      
      const morePosts = await loadConnectionPosts(
        effectiveRadius,
        effectiveLocation,
        lastPostTimestamp,
        10
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
    const currentPost = posts.find(post => post.id === postId);
    if (!currentPost) return;

    const firestore = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;

    const currentLiked = currentPost.isLikedByUser;
    const currentLikesCount = currentPost.likesCount;

    setPosts(prevPosts => prevPosts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLikedByUser: newLikedState,
            likesCount: newLikedState 
              ? post.likesCount + 1 
              : Math.max(0, post.likesCount - 1)
          }
        : post
    ));

    try {
      const likesCollectionRef = collection(firestore, 'posts', postId, 'likes');
      const postRef = doc(firestore, 'posts', postId);

      if (newLikedState) {
        await addDoc(likesCollectionRef, {
          authorId: user?.uid,
          authorName: user?.displayName || 'Anonymous',
          createdAt: new Date(),
        });
        await updateDoc(postRef, {
          likesCount: increment(1)
        });
        console.log('FeedScreen - Successfully added like to Firebase');
      } else {
        const userLikeQuery = query(likesCollectionRef, where('authorId', '==', user?.uid));
        const userLikeSnapshot = await getDocs(userLikeQuery);

        if (!userLikeSnapshot.empty) {
          const likeDoc = userLikeSnapshot.docs[0];
          await deleteDoc(likeDoc.ref);
          await updateDoc(postRef, {
            likesCount: increment(-1)
          });
          console.log('FeedScreen - Successfully removed like from Firebase');
        } else {
          console.log('FeedScreen - No like document found to remove');
        }
      }

      const updatedPostDoc = await getDoc(postRef);
      if (updatedPostDoc.exists()) {
        const updatedPostData = updatedPostDoc.data();
        setPosts(prevPosts => prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                likesCount: updatedPostData.likesCount || 0,
                isLikedByUser: newLikedState
              }
            : post
        ));
      }
    } catch (error) {
      console.error('FeedScreen - Error handling like:', error);

      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLikedByUser: currentLiked,
              likesCount: currentLikesCount
            }
          : post
      ));
    }
  };

  const handleVideoPlayPause = (postId: string) => {
    if (playingVideoId === postId) {
      setPlayingVideoId(null);
    } else {
      setPlayingVideoId(postId);
    }
  };

  const handleCommentsPress = (postId: string) => {
    setSelectedPostId(postId);
    setShowPostDetailsModal(true);
  };

  const renderPost = ({ item, index }: { item: ConnectionPost; index: number }) => {
    const isPlaying = playingVideoId === item.id;
    
    return (
      <View style={styles.postContainer}>
        {/* Full screen media */}
        <View style={styles.mediaContainer}>
          {item.mediaURL && (
            <PostMedia
              mediaURL={item.mediaURL}
              mediaType={item.mediaType}
              isFrontCamera={item.isFrontCamera}
              style={styles.media}
              showBorderRadius={false}
              onDoubleTap={() => handleLike(item.id, !item.isLikedByUser)}
              isVideoPlaying={isPlaying}
              isVideoMuted={false}
              onVideoPlayPause={() => handleVideoPlayPause(item.id)}
            />
          )}

          {/* Top header with notification bell */}
          <View style={styles.topHeader}>
            <Text style={styles.headerTitle}>{t('feed.title')}</Text>
            <NotificationBell 
              key={notificationKey}
              onPress={() => navigation.navigate('Notifications')} 
              color="white"
            />
          </View>

          {/* Bottom overlay content */}
          <View style={styles.bottomOverlay}>
            {/* Left side - User info and description */}
            <View style={styles.leftContent}>
              <View style={styles.userInfo}>
                <UserAvatar
                  photoURL={item.authorPhotoURL}
                  name={item.authorName}
                  size={40}
                  showOnlineStatus={false}
                />
                <Text style={styles.authorName}>{item.authorName}</Text>
              </View>
              {item.content && (
                <Text style={styles.description} numberOfLines={3}>
                  {item.content}
                </Text>
              )}
            </View>

            {/* Right side - Actions */}
            <View style={styles.rightActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleLike(item.id, !item.isLikedByUser)}
              >
                <Ionicons
                  name={item.isLikedByUser ? "heart" : "heart-outline"}
                  size={28}
                  color={item.isLikedByUser ? "#FF3040" : "white"}
                />
                {item.showLikeCount && (
                  <Text style={styles.actionText}>{item.likesCount}</Text>
                )}
              </TouchableOpacity>

              {item.allowComments && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCommentsPress(item.id)}
                >
                  <Ionicons name="chatbubble-outline" size={28} color="white" />
                  <Text style={styles.actionText}>{item.commentsCount}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Video tap overlay for play/pause */}
          {item.mediaType === 'video' && (
            <TouchableWithoutFeedback onPress={() => handleVideoPlayPause(item.id)}>
              <View style={styles.videoTapOverlay} />
            </TouchableWithoutFeedback>
          )}
        </View>
      </View>
    );
  };

  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const currentIndex = Math.round(contentOffset.y / height);
    
    // Load more posts when approaching the end
    if (currentIndex >= posts.length - 3 && hasMorePosts && !loadingMore) {
      loadMorePosts();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <FeedSkeleton count={1} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {posts.length === 0 ? (
        <EmptyFeedState 
          currentTheme={currentTheme} 
          title={currentUserLocation ? t('feed.noPosts') : undefined}
          subtitle={currentUserLocation ? t('feed.shareFirst') : undefined}
          onLocationEnabled={() => {
            loadPosts(true);
          }}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScrollToIndexFailed={onScrollToIndexFailed}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          removeClippedSubviews={false}
          initialNumToRender={2}
          maxToRenderPerBatch={3}
          windowSize={5}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="white"
              colors={["white"]}
              progressBackgroundColor="transparent"
            />
          }
        />
      )}

      <PostDetailsModal
        visible={showPostDetailsModal}
        onClose={() => {
          setShowPostDetailsModal(false);
          setSelectedPostId(null);
        }}
        postId={selectedPostId}
        currentTheme={currentTheme}
        onCommentsCountChange={(newCount) => {
          if (selectedPostId) {
            setPosts(prevPosts => prevPosts.map(post => 
              post.id === selectedPostId 
                ? { ...post, commentsCount: newCount }
                : post
            ));
          }
        }}
        onLikesCountChange={(newCount, isLikedByUser) => {
          if (selectedPostId) {
            setPosts(prevPosts => prevPosts.map(post => 
              post.id === selectedPostId 
                ? { ...post, likesCount: newCount, isLikedByUser: isLikedByUser }
                : post
            ));
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  postContainer: {
    width: width,
    height: height,
    position: 'relative',
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  topHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  leftContent: {
    flex: 1,
    marginRight: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  description: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  rightActions: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  videoTapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 5,
  },
});
