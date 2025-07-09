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
  SafeAreaView,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList } from 'react-native-gesture-handler';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { locationService } from '../services/locationService';
import NotificationBell from '../components/NotificationBell';
import FeedSkeleton from '../components/FeedSkeleton';
import PostMedia from '../components/PostMedia';
import EmptyFeedState from '../components/EmptyFeedState';
import PostDetailsModal from '../components/PostDetailsModal';
import UserAvatar from '../components/UserAvatar';
import SkeletonLoader from '../components/SkeletonLoader';
import { useTranslation } from 'react-i18next';
import { 
  updateUserLastSeen, 
  loadUserSettings, 
  handleLikePost,
  loadFeedPosts 
} from '../utils/feedUtils';
import { updatePost } from '../store/feedSlice';
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
import { useVideoPlayer, useEvent } from 'expo-video';
import { COLORS } from '../config/constants';

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
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList>(null);
  const [videoPlayers, setVideoPlayers] = useState<Map<string, any>>(new Map());
  const [videoMuteStates, setVideoMuteStates] = useState<Map<string, boolean>>(new Map());
  const [videoPlayStates, setVideoPlayStates] = useState<Map<string, boolean>>(new Map());
  const [visiblePostIndex, setVisiblePostIndex] = useState(0);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  // Video player management
  const [currentlyPlayingVideo, setCurrentlyPlayingVideo] = useState<string | null>(null);
  const [videoStates, setVideoStates] = useState<{[key: string]: {isPlaying: boolean, isMuted: boolean}}>({});
  const [focusedVideoId, setFocusedVideoId] = useState<string | null>(null);
  const [mediaLoadingStates, setMediaLoadingStates] = useState<{[key: string]: boolean}>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<{[key: string]: boolean}>({});
  const [connectionIds, setConnectionIds] = useState<Set<string>>(new Set());

  const currentTheme = getTheme(isDarkMode);
  const videoPlayersRef = useRef<{[key: string]: any}>({});

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in kilometers
    return d;
  };

  const loadUserConnections = async () => {
    try {
      const { getAuth, getFirestore } = await import('../services/firebase');
      const { collection, query, where, getDocs } = await import('firebase/firestore');

      const auth = getAuth();
      const firestore = getFirestore();
      const currentUser = auth.currentUser;

      if (!currentUser) return new Set<string>();

      const connectionsQuery = query(
        collection(firestore, 'connections'),
        where('participants', 'array-contains', currentUser.uid)
      );

      const connectionsSnapshot = await getDocs(connectionsQuery);
      const connectedUserIds = new Set<string>();

      connectionsSnapshot.docs.forEach(doc => {
        const participants = doc.data().participants;
        participants.forEach((id: string) => {
          if (id !== currentUser.uid) {
            connectedUserIds.add(id);
          }
        });
      });

      setConnectionIds(connectedUserIds);
      return connectedUserIds;
    } catch (error) {
      console.error('Error loading user connections:', error);
      return new Set<string>();
    }
  };

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
      if (post.mediaType === 'video') {
        console.log('Video post became visible, auto-playing:', post.id);
        setPlayingVideoId(post.id);
        // Update video states for this specific video
        setVideoStates(prev => ({
          ...prev,
          [post.id]: {
            ...prev[post.id],
            isPlaying: true,
            isMuted: false
          }
        }));
        setCurrentlyPlayingVideo(post.id);

        // Pause all other videos
        Object.keys(videoStates).forEach(id => {
          if (id !== post.id && videoStates[id]?.isPlaying) {
            setVideoStates(prev => ({
              ...prev,
              [id]: {
                ...prev[id],
                isPlaying: false
              }
            }));
          }
        });
      } else if (post.mediaType === 'image') {
        // Pause all videos when image is visible
        setPlayingVideoId(null);
        setCurrentlyPlayingVideo(null);
        Object.keys(videoStates).forEach(id => {
          if (videoStates[id]?.isPlaying) {
            setVideoStates(prev => ({
              ...prev,
              [id]: {
                ...prev[id],
                isPlaying: false
              }
            }));
          }
        });
      }
    }
  }, [playingVideoId, isScreenFocused, videoStates]);

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

        // Update video states to show paused state and mark as tapped when losing focus
        setVideoStates(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(id => {
            if (updated[id]?.isPlaying) {
              updated[id] = {
                ...updated[id],
                isPlaying: false
              };
            }
          });
          return updated;
        });
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

              // Load user connections BEFORE loading posts
              console.log('FeedScreen: Loading user connections...');
              const freshConnectionIds = await loadUserConnections();

              // Start location tracking and wait for initial location update
              console.log('FeedScreen: Starting location tracking...');
              const locationTrackingStarted = await locationService.startLocationTracking();

              if (locationTrackingStarted) {
                console.log('FeedScreen: Location tracking started successfully');

                // Wait a moment for the initial location update to complete
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Get the updated location after tracking started
                const updatedLocation = await locationService.getCurrentLocation();
                if (updatedLocation) {
                  console.log('FeedScreen: Updated location obtained:', updatedLocation);
                  setCurrentUserLocation(updatedLocation);
                }
              } else {
                console.log('FeedScreen: Location tracking failed to start');
              }

              console.log('FeedScreen: Loading posts...');
              await loadPosts(false, freshConnectionIds);
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

  const loadPosts = async (isRefresh = false, freshConnectionIds?: Set<string>) => {
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

      const { getAuth, getFirestore } = await import('../services/firebase');
      const auth = getAuth();
      const firestore = getFirestore();
      const currentUser = auth.currentUser;

      // Load feed posts with proper location and network filtering
      const feedResult = await loadFeedPosts(10, undefined, currentUser?.uid);
      let feedPosts = feedResult.posts;

      // Use fresh connection data if provided, otherwise use current state
      const activeConnectionIds = freshConnectionIds || connectionIds;

      // Filter out current user's posts and add connection information
      // (loadFeedPosts already handles location filtering properly)
      const postsWithConnectionInfo = feedPosts
        .filter(post => post.authorId !== currentUser?.uid) // Exclude current user's posts
        .map(post => ({
          ...post,
          isFromConnection: activeConnectionIds.has(post.authorId)
        }));

      console.log('FeedScreen - RAW FETCHED POSTS FROM loadFeedPosts:');
      console.log('='.repeat(80));
      console.log('Total posts fetched:', postsWithConnectionInfo.length);
      console.log('Current user location:', currentUserLocation);
      console.log('User radius:', userRadius);
      console.log('Connection IDs:', Array.from(connectionIds));

      // Debug: Log which users have posts vs which are in nearby
      console.log('Authors with posts:', postsWithConnectionInfo.map(p => ({ id: p.authorId, name: p.authorName })));

      // Log posts that might be from users outside radius
      postsWithConnectionInfo.forEach(post => {
        if (currentUserLocation && post.authorLocation) {
          const distance = calculateDistance(
            currentUserLocation.latitude,
            currentUserLocation.longitude,
            post.authorLocation.latitude,
            post.authorLocation.longitude
          );
          console.log(`Post author ${post.authorName}: ${distance.toFixed(2)}km away, within radius: ${distance <= userRadius}`);
        }
      });

      if (isRefresh) {
        setPosts(postsWithConnectionInfo);
        // Initialize loading states for all posts with images
        const newLoadingStates: {[key: string]: boolean} = {};
        postsWithConnectionInfo.forEach(post => {
          if ((post.mediaType === 'picture' || post.mediaType === 'image') && post.mediaURL) {
            newLoadingStates[post.id] = true;
          }
        });
        setMediaLoadingStates(newLoadingStates);
      } else {
        setPosts(postsWithConnectionInfo);
        // Initialize loading states for all posts with images
        const newLoadingStates: {[key: string]: boolean} = {};
        postsWithConnectionInfo.forEach(post => {
          if ((post.mediaType === 'picture' || post.mediaType === 'image') && post.mediaURL) {
            newLoadingStates[post.id] = true;
          }
        });
        setMediaLoadingStates(newLoadingStates);
      }

      if (postsWithConnectionInfo.length > 0) {
        setLastPostTimestamp(postsWithConnectionInfo[postsWithConnectionInfo.length - 1].createdAt);
      }

      setHasMorePosts(feedResult.hasMore);

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

      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      // For pagination, we'll need to implement a different approach since loadFeedPosts uses DocumentSnapshot
      // For now, let's load more posts without pagination
      const feedResult = await loadFeedPosts(10, undefined, currentUser?.uid);
      const morePosts = feedResult.posts.filter(post => 
        post.authorId !== currentUser?.uid && // Exclude current user's posts
        !posts.some(existingPost => existingPost.id === post.id)
      );

      // Add connection information to new posts
      const morePostsWithConnectionInfo = morePosts.map(post => ({
        ...post,
        isFromConnection: connectionIds.has(post.authorId)
      }));

      console.log('Loaded more posts:', morePostsWithConnectionInfo.length);

      if (morePostsWithConnectionInfo.length > 0) {
        setPosts(prevPosts => {
          const newPosts = [...prevPosts, ...morePostsWithConnectionInfo];
          console.log('Total posts after loading more:', newPosts.length);
          return newPosts;
        });

        // Initialize loading states for new posts with images
        setMediaLoadingStates(prev => {
          const newLoadingStates = { ...prev };
          morePostsWithConnectionInfo.forEach(post => {
            if ((post.mediaType === 'picture' || post.mediaType === 'image') && post.mediaURL) {
              newLoadingStates[post.id] = true;
            }
          });
          return newLoadingStates;
        });

        setLastPostTimestamp(morePostsWithConnectionInfo[morePostsWithConnectionInfo.length - 1].createdAt);
        setHasMorePosts(feedResult.hasMore);
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
    // Reset all pagination and state variables like initial load
    setLastDoc(null);
    setLastPostTimestamp(null);
    setHasMore(true);
    setHasMorePosts(true);
    setError(null);
    setRetryCount(0);

    // Reset video states
    setPlayingVideoId(null);
    setCurrentlyPlayingVideo(null);
    setVideoStates({});
    setFocusedVideoId(null);
    setExpandedDescriptions({});
    setMediaLoadingStates({});

    // Reload user connections in case they changed
    const freshConnectionIds = await loadUserConnections();

    // Load posts with refresh flag and fresh connection data
    await loadPosts(true, freshConnectionIds);
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

  const handleVideoPlayPauseToggle = (postId: string, shouldPlay: boolean) => {
    console.log('FeedScreen - handleVideoPlayPauseToggle:', postId, shouldPlay);

    // Update video states immediately for UI responsiveness
    setVideoStates(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        isPlaying: shouldPlay
      }
    }));

    // Update playing video ID
    if (shouldPlay) {
      setPlayingVideoId(postId);
      setCurrentlyPlayingVideo(postId);

      // Pause all other videos
      Object.keys(videoStates).forEach(id => {
        if (id !== postId && videoStates[id]?.isPlaying) {
          setVideoStates(prev => ({
            ...prev,
            [id]: {
              ...prev[id],
              isPlaying: false
            }
          }));
        }
      });
    } else {
      setPlayingVideoId(null);
      setCurrentlyPlayingVideo(null);
    }

    const videoPlayer = videoPlayersRef.current[postId];
    if (videoPlayer) {
      if (shouldPlay) {
        videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
    }
  };

  // Update video states when actual playback changes
  const updateVideoPlayingState = (postId: string, isPlaying: boolean) => {
    setVideoStates(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        isPlaying
      }
    }));
  };

  // Handle video focus changes for autoplay
  const handleVideoFocus = (postId: string) => {
    console.log('Video in focus:', postId);
    setFocusedVideoId(postId);
    // Auto-play the focused video if it's not already playing
    const post = posts.find(p => p.id === postId);
    if (post?.mediaType === 'video') {
      const currentState = videoStates[postId];
      if (!currentState?.isPlaying) {
        // Start the video player but don't update isPlaying state yet
        // The state will be updated when the video actually starts playing
        const videoPlayer = videoPlayersRef.current[postId];
        if (videoPlayer) {
          videoPlayer.play();
        }
      }
    }
  };

  const handleVideoBlur = (postId: string) => {
    console.log('Video lost focus:', postId);
    if (focusedVideoId === postId) {
      setFocusedVideoId(null);
      // Pause the video when it loses focus
      handleVideoPlayPauseToggle(postId, false);
    }
  };

  const handleCommentsPress = (postId: string) => {
    setSelectedPostId(postId);
    setShowPostDetailsModal(true);
  };

  const handleMediaLoad = (postId: string) => {
    setMediaLoadingStates(prev => ({
      ...prev,
      [postId]: false
    }));
  };

  const toggleDescriptionExpansion = (postId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleVideoMuteToggle = (postId: string) => {
    setVideoStates(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        isMuted: !prev[postId]?.isMuted
      }
    }));
  };

  const handleCommentsCountChange = (postId: string, newCount: number) => {
    console.log('FeedScreen - handleCommentsCountChange:', postId, newCount);
    
    // Update local posts state with the exact count passed from modal
    setPosts(prevPosts => {
      const updated = prevPosts.map(post => 
        post.id === postId ? { ...post, commentsCount: newCount } : post
      );
      console.log('FeedScreen - Updated posts:', updated.find(p => p.id === postId)?.commentsCount);
      return updated;
    });

    // Also update Redux state to keep it in sync
    dispatch(updatePost({
      postId,
      updates: { commentsCount: newCount }
    }));
  };

  

  // Create video players for all video posts - moved outside useEffect to avoid hook rule violations
  const videoPlayerCreated = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Clean up players for posts that no longer exist
    Object.keys(videoPlayersRef.current).forEach(postId => {
      if (!posts.find(post => post.id === postId)) {
        delete videoPlayersRef.current[postId];
        videoPlayerCreated.current.delete(postId);
      }
    });
  }, [posts]);

  const renderPost = ({ item, index }: { item: ConnectionPost; index: number }) => {
    const isPlaying = playingVideoId === item.id;
    const isMediaLoading = mediaLoadingStates[item.id] || false;

    return (
      <View style={styles.postContainer}>
        {/* Full screen media */}
        <View style={styles.mediaContainer}>
          {/* Skeleton loading overlay for images */}
          {item.mediaType === 'picture' && isMediaLoading && (
            <TouchableWithoutFeedback onPress={() => handleLike(item.id, !item.isLikedByUser)}>
              <View style={styles.mediaLoadingSkeleton}>
                <SkeletonLoader
                  width="100%"
                  height="100%"
                  borderRadius={0}
                  forceDarkTheme={true}
                />
              </View>
            </TouchableWithoutFeedback>
          )}

          {item.mediaURL && (
            <PostMedia
              mediaURL={item.mediaURL}
              mediaType={item.mediaType}
              isFrontCamera={item.isFrontCamera}
              style={styles.media}
              showBorderRadius={false}
              onLoad={() => handleMediaLoad(item.id)}
              onDoubleTap={() => {
                console.log('PostMedia double tap - liking post:', item.id);
                handleLike(item.id, !item.isLikedByUser);
              }}
              isVideoPlaying={isPlaying}
              isVideoMuted={false}
              onVideoPlayPause={() => {
                console.log('PostMedia video play/pause toggle:', item.id);
                const currentlyPlaying = videoStates[item.id]?.isPlaying || isPlaying;
                handleVideoPlayPauseToggle(item.id, !currentlyPlaying);
              }}
              postId={item.id}
              onCommentsCountChange={handleCommentsCountChange}
            />
          )}



          {/* Bottom overlay content */}
          <View style={styles.bottomOverlay}>
            {/* Left side - User info and description */}
            <View style={styles.leftContent}>
              <TouchableOpacity 
                style={styles.userInfo}
                onPress={() => {
                  const [firstName, ...lastNameParts] = item.authorName.split(' ');
                  const lastName = lastNameParts.join(' ');

                  navigation.navigate('UserProfile', {
                    userId: item.authorId,
                    firstName: firstName || '',
                    lastName: lastName || '',
                    photoURL: item.authorPhotoURL || '',
                    bio: item.content || ''
                  });
                }}
              >
                <UserAvatar
                  photoURL={item.authorPhotoURL}
                  name={item.authorName}
                  size={40}
                  showOnlineStatus={false}
                />
                <View style={styles.authorNameContainer}>
                  <Text style={styles.authorName}>{item.authorName}</Text>
                  {item.isFromConnection && (
                    <View style={styles.connectionBadge}>
                      <Text style={styles.connectionText}>Connection</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              {item.content && (
                <TouchableOpacity onPress={() => toggleDescriptionExpansion(item.id)}>
                  <Text 
                    style={styles.description} 
                    numberOfLines={expandedDescriptions[item.id] ? undefined : 3}
                  >
                    {item.content}
                  </Text>
                </TouchableOpacity>
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


        </View>
      </View>
    );
  };

  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const currentIndex = Math.round(contentOffset.y / (height - 100));

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
    <View style={styles.container}>
      {/* Loading indicator at top */}
      {(loading || refreshing) && (
        <View style={styles.topLoadingIndicator}>
          <ActivityIndicator size="small" color="white" />
        </View>
      )}

      {posts.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <EmptyFeedState 
            currentTheme={currentTheme} 
            title={currentUserLocation ? t('feed.noPosts') : undefined}
            subtitle={currentUserLocation ? t('feed.shareFirst') : undefined}
            onLocationEnabled={() => {
              loadPosts(true);
            }}
          />
        </View>
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
          style={styles.feedList}
          contentContainerStyle={styles.feedContentContainer}
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
            handleCommentsCountChange(selectedPostId, newCount);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  emptyStateContainer: {
    flex: 1,
    backgroundColor: 'black',
    paddingBottom: 80,
  },
  feedList: {
    flex: 1,
    backgroundColor: 'black',
  },
  feedContentContainer: {
    paddingBottom: 80,
  },
  postContainer: {
    width: width,
    height: height,
    position: 'relative',
    backgroundColor: 'black',
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
  bottomOverlay: {
    position: 'absolute',
    bottom: 120,
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
  topLoadingIndicator: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    paddingVertical: 8,
  },
  authorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  connectionBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  connectionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
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

  descriptionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  descriptionModalContent: {
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    borderRadius: 16,
    padding: 20,
    maxWidth: '100%',
    maxHeight: '80%',
  },
  descriptionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfoModal: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarModal: {
    marginRight: 12,
  },
  userNameModal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  descriptionModalText: {
    fontSize: 16,
    lineHeight: 22,
    color: 'white',
  },
  mediaLoadingSkeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
});