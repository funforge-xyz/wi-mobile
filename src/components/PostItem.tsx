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
  onLike: (postId: string, liked: boolean) => void;
  currentTheme: any;
  navigation: any;
  showImageBorderRadius?: boolean;
  isVideoPlaying?: boolean;
  isVideoMuted?: boolean;
  onVideoMuteToggle?: (postId: string) => void;
}

export default function PostItem({ 
  post, 
  onLike, 
  currentTheme, 
  navigation, 
  showImageBorderRadius,
  isVideoPlaying = false,
  isVideoMuted = false,
  onVideoMuteToggle
}: PostItemProps) {
  const [showPostDetailsModal, setShowPostDetailsModal] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(!!post.mediaURL);
  const [modalVisible, setModalVisible] = useState(false);
  const [lastTap, setLastTap] = useState<number | null>(null);
  const videoRef = useRef<any>(null);
  const likeAnimationScale = useRef(new Animated.Value(1)).current;
  const likeAnimationOpacity = useRef(new Animated.Value(0)).current;

  const { t } = useTranslation();

  // Debug logging for isFrontCamera
  console.log('PostItem - Post ID:', post.id, 'isFrontCamera:', post.isFrontCamera, 'mediaType:', post.mediaType);

  // Create video player for video posts - only create if we have a video
  const videoPlayer = useVideoPlayer(
    post.mediaType === 'video' && post.mediaURL ? post.mediaURL : null, 
    player => {
      if (player && post.mediaType === 'video') {
        player.loop = true;
        player.muted = isVideoMuted;
        // Don't auto-play on creation, let the visibility logic handle it
      }
    }
  );

  console.log('PostItem - Video Debug:', {
    postId: post.id,
    mediaType: post.mediaType,
    hasMediaURL: !!post.mediaURL,
    isVideoPlaying,
    isMediaLoading,
    hasVideoPlayer: !!videoPlayer
  });

  // Update video player when playback state changes
  useEffect(() => {
    if (videoPlayer && post.mediaType === 'video') {
      videoPlayer.muted = isVideoMuted;
      if (isVideoPlaying) {
        console.log('Playing video:', post.id);
        videoPlayer.play();
      } else {
        console.log('Pausing video:', post.id);
        videoPlayer.pause();
      }
    }
  }, [videoPlayer, isVideoPlaying, isVideoMuted, post.mediaType]);

  // Handle media loading differently for videos vs images
  useEffect(() => {
    if (post.mediaType === 'video' && post.mediaURL) {
      // For videos, set loading to false immediately to show the VideoView
      setIsMediaLoading(false);
    } else if (post.mediaType === 'image' && post.mediaURL) {
      // For images, keep loading true until onLoad is called
      setIsMediaLoading(true);
    } else {
      setIsMediaLoading(false);
    }
  }, [post.mediaURL, post.mediaType]);

  // Use post data directly instead of local state
  const liked = post.isLikedByUser;
  const likesCount = post.likesCount;

  const handleLikePress = () => {
    onLike(post.id, liked);
  };

  const handleVideoMuteToggle = () => {
    if (onVideoMuteToggle) {
      onVideoMuteToggle(post.id);
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
    if (isMediaLoading) return;
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      // This is a double tap - only like if not already liked
      if (!liked) {
        onLike(post.id, liked);
        triggerLikeAnimation();
      }
      setLastTap(null);
    } else {
      // This is a single tap - record the time
      setLastTap(now);
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
          {/* Shimmer skeleton overlay while loading */}
          {isMediaLoading && (
            <TouchableWithoutFeedback onPress={handleDoubleTap}>
              <View style={styles.mediaLoadingSkeleton}>
                <SkeletonLoader
                  width="100%"
                  height="100%"
                  borderRadius={0}
                />
              </View>
            </TouchableWithoutFeedback>
          )}

          <PostMedia
            mediaURL={post.mediaURL}
            mediaType={post.mediaType}
            onLoad={() => setIsMediaLoading(false)}
            isFrontCamera={post.isFrontCamera}
            style={styles.media}
            showBorderRadius={showImageBorderRadius}
            onDoubleTap={handleDoubleTap}
            likeAnimationOpacity={likeAnimationOpacity}
            likeAnimationScale={likeAnimationScale}
            isVideoPlaying={isVideoPlaying}
            isVideoMuted={isVideoMuted}
            onVideoMuteToggle={() => onVideoMuteToggle && onVideoMuteToggle(post.id)}
            videoPlayer={post.mediaType === 'video' ? videoPlayer : undefined}
          />
        </View>
      )}

      <PostActions
        liked={liked}
        likesCount={likesCount}
        commentsCount={post.commentsCount}
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