import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
} from 'react-native';
import { SPACING, FONTS, COLORS } from '../config/constants';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostMedia from './PostMedia';
import PostActions from './PostActions';
import PostDetailsModal from './PostDetailsModal';
import SkeletonLoader from './SkeletonLoader';
import { useTranslation } from 'react-i18next';
import { getFirestore, collection, addDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { authService } from '../services/auth';

const { width } = Dimensions.get('window');

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

interface PostItemProps {
  post: ConnectionPost;
  liked: boolean;
  likesCount: number;
  commentsCount: number;
  onLikePress: () => void;
  onCommentPress: () => void;
  onUserPress: () => void;
  onPostPress: () => void;
  currentTheme: any;
  isVideoPlaying?: boolean;
  isVideoMuted?: boolean;
  isVideoLoading?: boolean;
  onVideoMuteToggle?: (postId: string) => void;
  onVideoPlayPauseToggle?: (postId: string, shouldPlay: boolean) => void;
  onVideoFocus?: () => void;
  onVideoBlur?: () => void;
  videoPlayer?: any;
  showImageBorderRadius?: boolean;
  onCommentsCountChange?: (postId: string, newCount: number) => void;
  onLikesCountChange?: (postId: string, newCount: number, isLikedByUser: boolean) => void;
  forceDarkTheme?: boolean;
}

export default function PostItem({
  post,
  liked,
  likesCount,
  commentsCount,
  onLikePress,
  onCommentPress,
  onUserPress,
  onPostPress,
  currentTheme,
  isVideoPlaying,
  isVideoMuted,
  isVideoLoading,
  onVideoMuteToggle,
  onVideoPlayPauseToggle,
  onVideoFocus,
  onVideoBlur,
  videoPlayer,
  showImageBorderRadius = true,
  onCommentsCountChange,
  onLikesCountChange,
  forceDarkTheme = false,
}: PostItemProps) {
  const [showPostDetailsModal, setShowPostDetailsModal] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(!!post.mediaURL);
  const [modalVisible, setModalVisible] = useState(false);
  const [lastTap, setLastTap] = useState<number | null>(null);
  const videoRef = useRef<any>(null);
  const likeAnimationScale = useRef(new Animated.Value(1)).current;
  const likeAnimationOpacity = useRef(new Animated.Value(0)).current;
  const playButtonAnimationScale = useRef(new Animated.Value(1)).current;
  const playButtonAnimationOpacity = useRef(new Animated.Value(0)).current;

  const { t } = useTranslation();

  // Debug logging for isFrontCamera
  console.log('PostItem - Post ID:', post.id, 'isFrontCamera:', post.isFrontCamera, 'mediaType:', post.mediaType);

  // Create video player for video posts - always call hook, but conditionally set source
  const internalVideoPlayer = useVideoPlayer(
    post.mediaType === 'video' && post.mediaURL ? post.mediaURL : '', 
    player => {
      if (player && post.mediaType === 'video' && post.mediaURL) {
        player.loop = true;
        player.muted = isVideoMuted;
        // Don't auto-play on creation, let the visibility logic handle it
      }
    }
  );

  // Listen to video player events
  const { isPlaying: videoIsActuallyPlaying } = useEvent(internalVideoPlayer, 'playingChange', { isPlaying: internalVideoPlayer?.playing || false });

  // Use the passed videoPlayer prop if available, otherwise use internal
  const activeVideoPlayer = videoPlayer || internalVideoPlayer;

  // Update video player when playback state changes
  useEffect(() => {
    if (activeVideoPlayer && post.mediaType === 'video' && post.mediaURL) {
      activeVideoPlayer.muted = isVideoMuted;
      if (isVideoPlaying) {
        console.log('Playing video:', post.id);
        activeVideoPlayer.play();
      } else {
        console.log('Pausing video:', post.id);
        activeVideoPlayer.pause();
      }
    }
  }, [activeVideoPlayer, isVideoPlaying, isVideoMuted, post.mediaType, post.mediaURL]);

  // Handle media loading differently for videos vs images  
  useEffect(() => {
    if (post.mediaType === 'video' && post.mediaURL) {
      // For videos, set loading to false immediately to show the VideoView
      setIsMediaLoading(false);
    } else if (post.mediaType === 'picture' && post.mediaURL) {
      // For images, keep loading true until onLoad is called
      setIsMediaLoading(true);
    } else {
      setIsMediaLoading(false);
    }
  }, [post.mediaURL, post.mediaType]);

  const handleLikePress = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) return;

      const db = getFirestore();
      const likesRef = collection(db, 'posts', post.id, 'likes');

      // Check if user already liked this post
      const existingLikeQuery = query(likesRef, where('authorId', '==', currentUser.uid));
      const existingLikeSnapshot = await getDocs(existingLikeQuery);

      if (!existingLikeSnapshot.empty) {
        // User has already liked - remove the like
        const likeDoc = existingLikeSnapshot.docs[0];
        await deleteDoc(likeDoc.ref);
      } else {
        // User hasn't liked - add the like
        await addDoc(likesRef, {
          authorId: currentUser.uid,
          authorName: currentUser.displayName || 'Anonymous',
          createdAt: new Date()
        });
      }

      // Trigger parent component update
      onLikePress();
    } catch (error) {
      console.error('Error handling like in PostItem:', error);
    }
  };

  const handleVideoMuteToggle = () => {
    if (onVideoMuteToggle) {
      onVideoMuteToggle(post.id);
    }
  };

  const handleVideoPlayPause = () => {
    if (onVideoPlayPauseToggle && post.mediaType === 'video') {
      // Toggle the play state - if currently playing, pause it (set to false), otherwise play it (set to true)
      onVideoPlayPauseToggle(post.id, !isVideoPlaying);
    }
  };

  const triggerLikeAnimation = () => {
    // Reset animation values
    likeAnimationScale.setValue(0);
    likeAnimationOpacity.setValue(1);

    // Animate scale and opacity
    Animated.parallel([
      Animated.timing(likeAnimationScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(likeAnimationOpacity, {
        toValue: 0,
        duration: 300,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
      // Double tap detected - trigger like
      handleLikePress();

      // Animate like heart
      Animated.sequence([
        Animated.timing(likeAnimationOpacity, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(likeAnimationScale, {
            toValue: 1.5,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(likeAnimationOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(likeAnimationScale, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start();

      setLastTap(null);
    } else {
      setLastTap(now);

      // Single tap on video - toggle play/pause with animation
      if (post.mediaType === 'video') {
        const shouldPlay = !isVideoPlaying;
        onVideoPlayPauseToggle?.(post.id, shouldPlay);

        // Show play button animation when pausing
        if (!shouldPlay) {
          Animated.sequence([
            Animated.timing(playButtonAnimationOpacity, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.parallel([
              Animated.timing(playButtonAnimationScale, {
                toValue: 1.2,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(playButtonAnimationOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(playButtonAnimationScale, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }
    }
  };

  return (
    <View 
      style={[styles.postContainer, { backgroundColor: currentTheme.surface }]}
    >
      <PostHeader
        authorName={post.authorName}
        authorPhotoURL={post.authorPhotoURL}
        createdAt={post.createdAt}
        isAuthorOnline={post.isAuthorOnline}
        isFromConnection={post.isFromConnection}
        currentTheme={currentTheme}
        authorId={post.authorId}
        navigation={navigation}
      />

      {post.content && (
        <PostContent content={post.content} currentTheme={currentTheme} />
      )}

      {/* Media - Full width, no padding */}
      {post.mediaURL && (
        <View style={styles.mediaContainer}>
          <PostMedia
            mediaURL={post.mediaURL}
            mediaType={post.mediaType}
            style={[styles.media]}
            showBorderRadius={showImageBorderRadius}
            onLoad={() => setIsMediaLoading(false)}
            isFrontCamera={post.isFrontCamera}
            onDoubleTap={handleDoubleTap}
            likeAnimationOpacity={post.mediaType === 'video' ? playButtonAnimationOpacity : likeAnimationOpacity}
            likeAnimationScale={post.mediaType === 'video' ? playButtonAnimationScale : likeAnimationScale}
            isVideoPlaying={isVideoPlaying}
            isVideoMuted={isVideoMuted}
            onVideoMuteToggle={() => onVideoMuteToggle?.(post.id)}
            onVideoPlayPause={() => onVideoPlayPauseToggle?.(post.id, !isVideoPlaying)}
            videoPlayer={activeVideoPlayer}
            forceDarkTheme={forceDarkTheme}
          />
        </View>
      )}

      <PostActions
        liked={post.isLikedByUser}
        likesCount={post.likesCount}
        commentsCount={commentsCount}
        showLikeCount={post.showLikeCount}
        allowComments={post.allowComments}
        onLikePress={handleLikePress}
        onCommentPress={() => setShowPostDetailsModal(true)}
        currentTheme={currentTheme}
      />

      <PostDetailsModal
        visible={showPostDetailsModal}
        onClose={() => setShowPostDetailsModal(false)}
        postId={post.id}
        currentTheme={currentTheme}
        onCommentsCountChange={(newCount) => {
          if (onCommentsCountChange) {
            onCommentsCountChange(post.id, newCount);
          }
        }}
        onLikesCountChange={(newCount, isLikedByUser) => {
          if (onLikesCountChange) {
            onLikesCountChange(post.id, newCount, isLikedByUser);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  postContainer: {
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 4/5, // 4:5 aspect ratio like SinglePostDisplay
    marginVertical: SPACING.sm,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: 'black',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  });