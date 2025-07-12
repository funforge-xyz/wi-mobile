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
  ScrollView,
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
import LocationPermissionModal from '../components/LocationPermissionModal';
import { useTranslation } from 'react-i18next';
import { 
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
import { COLORS } from '../config/constants';
import * as Location from 'expo-location';

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
  const [trackingRadius, setTrackingRadius] = useState<number>(0.1);
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
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'checking' | 'granted' | 'denied'>('checking');
  const [showLocationModal, setShowLocationModal] = useState(false);

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

    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        setLoading(true);
        setLocationPermissionStatus('checking');

        // Step 1: Request foreground location permissions
        console.log('📍 Step 1: Requesting foreground location permissions...');
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        
        if (foregroundStatus !== 'granted') {
          console.log('❌ Foreground location permission denied');
          setLocationPermissionStatus('denied');
          setLoading(false);
          return;
        }
        console.log('✅ Foreground location permissions granted');

        // Step 2: Request background location permissions
        console.log('📍 Step 2: Requesting background location permissions...');
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        
        if (backgroundStatus !== 'granted') {
          console.log('❌ Background location permission denied');
          setLocationPermissionStatus('denied');
          setLoading(false);
          return;
        }
        console.log('✅ Background location permissions granted');

        // Step 3: Initialize Firebase and get user auth data
        console.log('🔥 Step 3: Initializing Firebase...');
        const { initializeFirebase, getAuth, getFirestore } = await import('../services/firebase');
        await initializeFirebase();
        const auth = getAuth();
        const firestore = getFirestore();
        
        unsubscribe = auth.onAuthStateChanged(async (user: any) => {
          if (!user) {
            console.log('❌ No authenticated user found');
            setLoading(false);
            setPosts([]);
            return;
          }

          try {
            await user.reload();
            const currentUser = auth.currentUser;
            if (!currentUser) {
              console.log('❌ User not found after reload');
              setLoading(false);
              setPosts([]);
              return;
            }

            console.log('👤 User authenticated:', currentUser.uid);
            setLocationPermissionStatus('granted');

            // Step 4: Get user document to check location and WiFi data
            console.log('📄 Step 4: Checking user data in Firebase...');
            const { doc, getDoc } = await import('firebase/firestore');
            const userDocRef = doc(firestore, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            let userHasLocationData = false;
            let userHasWifiData = false;
            let sameNetworkMatching = false;
            let userLocation = null;

            if (userDoc.exists()) {
              const userData = userDoc.data();
              userLocation = userData.location;
              userHasLocationData = !!userData.location && !!userData.location.latitude && !!userData.location.longitude;
              userHasWifiData = userData.currentNetworkId;
              sameNetworkMatching = userData.sameNetworkMatching || false;
              
              console.log('📊 User data status:', {
                hasLocation: userHasLocationData,
                hasWifi: userHasWifiData,
                wifiMatching: sameNetworkMatching
              });
            }

            // Step 5: Update Firebase if user doesn't have required data
            const needsLocationUpdate = !userHasLocationData;
            const needsWifiUpdate = sameNetworkMatching && !userHasWifiData;

            if (needsLocationUpdate || needsWifiUpdate) {
              console.log('📤 Step 5: Updating missing user data in Firebase...');
              
              let currentLocation = null;
              if (needsLocationUpdate) {
                console.log('📍 Getting current location...');
                try {
                  const locationResult = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                    // timeInterval: 5000,
                  });
                  currentLocation = {
                    latitude: locationResult.coords.latitude,
                    longitude: locationResult.coords.longitude
                  };
                  console.log('✅ Current location obtained:', currentLocation);
                } catch (locationError) {
                  console.error('❌ Failed to get current location:', locationError);
                  setLoading(false);
                  return;
                }
              } else {
                if(userLocation) {
                  setCurrentUserLocation(userLocation);
                }
              }

              let wifiInfo = null;
              if (needsWifiUpdate) {
                console.log('📶 Getting WiFi network info...');
                const { wifiService } = await import('../services/wifiService');
                wifiInfo = await wifiService.getCurrentWifiInfo();
                console.log('📶 WiFi info obtained:', wifiInfo);
              }

              // Update Firebase with missing data
              const { updateDoc } = await import('firebase/firestore');
              const updateData: any = {
                lastSeen: new Date()
              };

              if (currentLocation) {
                updateData.location = currentLocation;
                updateData.lastUpdatedLocation = new Date();
                setCurrentUserLocation(currentLocation);
              }

              if (wifiInfo && wifiInfo.isConnected && wifiInfo.networkId) {
                updateData.currentNetworkId = wifiInfo.networkId;
                updateData.lastNetworkUpdate = new Date();
              } else if (needsWifiUpdate) {
                updateData.currentNetworkId = null;
              }

              await updateDoc(userDocRef, updateData);
              console.log('✅ User data updated in Firebase');
            } else {
              // User already has required data, just get current location for local state
              if (userHasLocationData && userDoc.exists()) {
                const userData = userDoc.data();
                setCurrentUserLocation(userData.location);
                console.log('✅ Using existing location data from Firebase');
              }
            }

            // Step 6: Start location tracking
            console.log('🔄 Step 6: Starting location tracking...');
            const trackingStarted = locationService.startLocationTracking();
            if (!trackingStarted) {
              console.log('⚠️ Location tracking failed to start');
            } else {
              console.log('✅ Location tracking started successfully');
            }

            // Step 7: Load user settings and connections
            console.log('⚙️ Step 7: Loading user settings and connections...');
            const radius = await loadUserSettings();
            if (radius) {
              setTrackingRadius(radius);
            }

            const freshConnectionIds = await loadUserConnections();

            // Step 8: Load posts
            console.log('📰 Step 8: Loading posts...');
            const effectiveLocation = currentUserLocation || (userDoc.exists() ? userDoc.data().location : null);
            const effectiveRadius = radius || trackingRadius;

            await loadPosts(false, freshConnectionIds, effectiveLocation, 'granted', effectiveRadius);
            
            console.log('🎉 App initialization completed successfully');

          } catch (error) {
            console.error('❌ Error during user initialization:', error);
            setLoading(false);
          }
        });

        const handleAppStateChange = (nextAppState: string) => {
          if (nextAppState === 'active') {
            locationService.onAppForeground();
          } else if (nextAppState === 'background') {
            locationService.onAppBackground();
          }
        };

        appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

      } catch (error) {
        console.error('❌ Error during app initialization:', error);
        setLocationPermissionStatus('denied');
        setLoading(false);
      }
    };

    initializeApp();

    return () => {
      if (unsubscribe) unsubscribe();
      if (appStateSubscription) appStateSubscription?.remove();
    };
  }, []);

  console.log({currentUserLocation});

  const loadPosts = async (isRefresh = false, freshConnectionIds?: Set<string>, explicitLocation?: any, explicitPermissionStatus?: string, explicitTrackingRadius?: number) => {
    const effectiveLocation = explicitLocation || currentUserLocation;
    const effectivePermissionStatus = explicitPermissionStatus || locationPermissionStatus;
    const effectiveTrackingRadius = explicitTrackingRadius || trackingRadius;
    
    console.log('loadPosts called:', { isRefresh, effectiveLocation, effectiveTrackingRadius, effectivePermissionStatus });

    const { getAuth } = await import('../services/firebase');
    const auth = getAuth();
    if (!auth.currentUser) {
      console.log('User not authenticated, skipping post loading');
      setLoading(false);
      setRefreshing(false);
      setError('Authentication required');
      return;
    }

    // Ensure location permissions are granted before loading posts
    if (effectivePermissionStatus !== 'granted') {
      console.log('Location permissions not granted, cannot load posts');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Ensure we have location data before proceeding
    if (!effectiveLocation) {
      console.log('No current user location available, cannot load posts');
      setLoading(false);
      setRefreshing(false);
      setError('Location required to load feed');
      return;
    }

    console.log('Loading posts:', { isRefresh, effectiveLocation });

    try {
      if (isRefresh) {
        setRefreshing(true);
        setError(null);
      } else {
        setLoading(true);
        setError(null);
      }

      const currentUser = auth.currentUser;

      // Load feed posts with timeout and retry logic built-in
      const feedResult = await loadFeedPosts(10, undefined, currentUser?.uid, effectiveTrackingRadius);
      let feedPosts = feedResult.posts;

      // Use fresh connection data if provided, otherwise use current state
      const activeConnectionIds = freshConnectionIds || connectionIds;

      // Filter out current user's posts and add connection information
      const postsWithConnectionInfo = feedPosts
        .filter(post => post.authorId !== currentUser?.uid) // Exclude current user's posts
        .map(post => ({
          ...post,
          isFromConnection: activeConnectionIds.has(post.authorId)
        }));

      console.log('FeedScreen - Posts loaded successfully:', postsWithConnectionInfo.length);

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
      setRetryCount(0); // Reset retry count on success

    } catch (error) {
      console.error('Error loading posts:', error);
      setError(error instanceof Error ? error.message : 'Failed to load posts');
      
      // Implement retry logic for failed loads
      if (retryCount < 3) {
        console.log(`Retrying feed load (attempt ${retryCount + 1})`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          loadPosts(isRefresh, freshConnectionIds, explicitLocation, explicitPermissionStatus, explicitTrackingRadius);
        }, Math.pow(2, retryCount) * 1000); // Exponential backoff
        return;
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadMorePostsRef = useRef<NodeJS.Timeout>();

  const loadMorePosts = useCallback(async () => {
    console.log('loadMorePosts called:', { hasMorePosts, lastPostTimestamp, loadingMore });

    if (!hasMorePosts || loadingMore || !lastPostTimestamp) {
      console.log('Skipping loadMorePosts:', { hasMorePosts, lastPostTimestamp, loadingMore });
      return;
    }

    // Clear any existing timeout
    if (loadMorePostsRef.current) {
      clearTimeout(loadMorePostsRef.current);
    }

    // Debounce the call
    loadMorePostsRef.current = setTimeout(async () => {
      if (!hasMorePosts || loadingMore || !lastPostTimestamp) {
        return;
      }

    try {
      console.log('Loading more posts...');
      setLoadingMore(true);

      const effectiveRadius = currentUserLocation ? trackingRadius : 0;
      const effectiveLocation = currentUserLocation || { latitude: 0, longitude: 0 };

      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      // For pagination, we'll need to implement a different approach since loadFeedPosts uses DocumentSnapshot
      // For now, let's load more posts without pagination
      const feedResult = await loadFeedPosts(10, undefined, currentUser?.uid, effectiveRadius);
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
    }, 300); // 300ms debounce
  }, [hasMorePosts, lastPostTimestamp, loadingMore, currentUserLocation, trackingRadius, connectionIds]);

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
    await loadPosts(true, freshConnectionIds, currentUserLocation, locationPermissionStatus, trackingRadius);
  };

  const handleLike = async (postId: string, shouldLike?: boolean) => {
    const currentPost = posts.find(post => post.id === postId);
    if (!currentPost) return;

    const firestore = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    // Determine new like state - if shouldLike is provided, use it, otherwise toggle current state
    const newLikedState = shouldLike !== undefined ? shouldLike : !currentPost.isLikedByUser;

    const currentLiked = currentPost.isLikedByUser;
    const currentLikesCount = currentPost.likesCount;

    // Update UI immediately for responsiveness
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
        // Check if user already liked this post
        const userLikeQuery = query(likesCollectionRef, where('authorId', '==', user.uid));
        const userLikeSnapshot = await getDocs(userLikeQuery);
        
        if (userLikeSnapshot.empty) {
          await addDoc(likesCollectionRef, {
            authorId: user.uid,
            authorName: user.displayName || 'Anonymous',
            createdAt: new Date(),
          });
          await updateDoc(postRef, {
            likesCount: increment(1)
          });
          
          // Send like notification
          const { createLikeNotification } = await import('../services/notifications');
          await createLikeNotification(postId, currentPost.authorId);
          
          console.log('FeedScreen - Successfully added like to Firebase');
        } else {
          console.log('FeedScreen - User already liked this post');
        }
      } else {
        // Remove like
        const userLikeQuery = query(likesCollectionRef, where('authorId', '==', user.uid));
        const userLikeSnapshot = await getDocs(userLikeQuery);

        if (!userLikeSnapshot.empty) {
          const likeDoc = userLikeSnapshot.docs[0];
          await deleteDoc(likeDoc.ref);
          await updateDoc(postRef, {
            likesCount: increment(-1)
          });
          
          // Remove like notification when unliking
          const { removeLikeNotification } = await import('../services/notifications');
          await removeLikeNotification(postId, currentPost.authorId, user.uid);
          
          console.log('FeedScreen - Successfully removed like from Firebase');
        } else {
          console.log('FeedScreen - No like document found to remove');
        }
      }

      // Fetch updated post data to ensure accuracy
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

      // Revert UI changes on error
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

  const handleLocationEnabled = async () => {
    setShowLocationModal(false);
    setLocationPermissionStatus('checking');
    setLoading(true);
    
    try {
      const hasPermissions = await locationService.requestPermissions();
      if (hasPermissions) {
        console.log('Location permissions granted, restarting full initialization...');
        setLocationPermissionStatus('granted');
        
        // Load user settings for radius
        const radius = await loadUserSettings();
        if (radius) {
          setTrackingRadius(radius);
        }

        // Get current location
        const location = await locationService.getCurrentLocation();
        if (location) {
          setCurrentUserLocation(location);
          
          // Start location tracking
          await locationService.startLocationTracking();
          
          // Load user connections
          const freshConnectionIds = await loadUserConnections();
          
          // Load posts with all data ready
          await loadPosts(true, freshConnectionIds, location, 'granted', radius);
        } else {
          console.log('Failed to get current location after permissions granted');
          setLocationPermissionStatus('denied');
          setLoading(false);
        }
      } else {
        setLocationPermissionStatus('denied');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error enabling location:', error);
      setLocationPermissionStatus('denied');
      setLoading(false);
    }
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
            <TouchableWithoutFeedback onPress={() => handleLike(item.id, true)}>
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
                if (!item.isLikedByUser) {
                  handleLike(item.id, true);
                }
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
              forceDarkTheme={true}
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
                      <Text style={styles.connectionText}>{t('feed.connection')}</Text>
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
                onPress={() => handleLike(item.id)}
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
        {error && retryCount > 0 && (
          <View style={styles.errorRetryContainer}>
            <Text style={styles.errorText}>
              {error} (Retry {retryCount}/3)
            </Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  if (error && !loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load feed</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setError(null);
              setRetryCount(0);
              loadPosts(true, undefined, currentUserLocation, locationPermissionStatus, trackingRadius);
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
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
        <ScrollView 
          contentContainerStyle={styles.emptyStateContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="white"
              colors={["white"]}
              progressBackgroundColor="transparent"
            />
          }
        >
          <EmptyFeedState 
            currentTheme={currentTheme} 
            title={locationPermissionStatus === 'granted' && currentUserLocation ? t('feed.noPosts') : undefined}
            subtitle={locationPermissionStatus === 'granted' && currentUserLocation ? t('feed.shareFirst') : undefined}
            locationPermissionStatus={locationPermissionStatus}
            onLocationEnabled={handleLocationEnabled}
          />
        </ScrollView>
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
          onEndReached={loadMorePosts}
          onEndReachedThreshold={0.5}
        />
      )}

      <PostDetailsModal
        visible={showPostDetailsModal}
        onClose={() => {
          setShowPostDetailsModal(false);
          setSelectedPostId(null);
        }}
        postId={selectedPostId}
        post={selectedPostId ? posts.find(p => p.id === selectedPostId) : null}
        currentTheme={currentTheme}
        onCommentsCountChange={(newCount) => {
          if (selectedPostId) {
            handleCommentsCountChange(selectedPostId, newCount);
          }
        }}
      />

      <LocationPermissionModal
        isVisible={showLocationModal}
        onRequestPermission={handleLocationEnabled}
        onCancel={() => setShowLocationModal(false)}
        permissionDenied={locationPermissionStatus === 'denied'}
        hasTriedRequest={locationPermissionStatus !== 'checking'}
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
    // paddingBottom: 80,
  },
  feedList: {
    flex: 1,
    backgroundColor: 'black',
  },
  feedContentContainer: {
    // paddingBottom: 80,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorRetryContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  errorText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
});