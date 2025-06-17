import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  AppState,
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
import { lightTheme, darkTheme, feedStyles } from '../styles/FeedStyles';

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
  const [notificationKey, setNotificationKey] = useState(0);
  const [userRadius, setUserRadius] = useState<number | null>(null);
  const [currentUserLocation, setCurrentUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  // Force NotificationBell to re-render when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setNotificationKey(prev => prev + 1);
    }, [])
  );

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let appStateSubscription: any;
    let lastSeenInterval: NodeJS.Timeout |  number;

    const loadUserSettingsAndLocation = async () => {
      try {
        // Load user's radius setting
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
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };

    const initializeAndSetupAuth = async () => {
      try {
        // Ensure Firebase is initialized first
        const { initializeFirebase, getAuth } = await import('../services/firebase');

        // Initialize Firebase if not already done
        await initializeFirebase();

        const auth = getAuth();

        unsubscribe = auth.onAuthStateChanged((user: any) => {
          if (user) {
            // Initialize location tracking for the authenticated user (with error handling)
            locationService.startLocationTracking().catch((error) => {
              console.log('Location tracking not available:', error);
              // Continue without location tracking
            });

            loadUserSettingsAndLocation();
            loadPosts();
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

  const loadPosts = async () => {
    let timeout: NodeJS.Timeout | number | undefined;
    
    try {
      setLoading(true);

      // Add timeout to prevent infinite loading
      timeout = setTimeout(() => {
        console.warn('Loading posts is taking too long');
        setLoading(false);
      }, 15000);

      const connectionPosts = await loadConnectionPosts(userRadius, currentUserLocation);
      setPosts(connectionPosts);
      if (timeout) clearTimeout(timeout);
    } catch (error) {
      console.error('Error loading posts:', error);
      if (timeout) clearTimeout(timeout);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLike = async (postId: string, liked: boolean) => {
    const result = await handleLikePost(postId, liked, posts);

    if (result) {
      // Optimistically update the UI
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likesCount: result.liked ? post.likesCount + 1 : post.likesCount - 1,
                isLikedByUser: result.liked,
              }
            : post
        )
      );
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

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostItem
            post={item}
            onLike={handleLike}
            currentTheme={currentTheme}
            navigation={navigation}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={<EmptyFeedState currentTheme={currentTheme} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={posts.length === 0 ? feedStyles.emptyContainer : undefined}
      />
    </SafeAreaView>
  );
}