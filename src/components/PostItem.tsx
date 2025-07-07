import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { SPACING, FONTS, COLORS } from '../config/constants';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostMedia from './PostMedia';
import PostActions from './PostActions';
import PostDetailsModal from './PostDetailsModal';
import SkeletonLoader from './SkeletonLoader';
import { useTranslation } from 'react-i18next';
import { useVideoPlayer } from 'expo-video';

const { width } = Dimensions.get('window');

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
  isFrontCamera?: boolean;
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

  // Initialize video player for video posts
  const videoPlayer = useVideoPlayer(
    post?.mediaURL && post?.mediaType === 'video' ? post.mediaURL : null, 
    player => {
      player.loop = true;
      player.muted = isVideoMuted || false;
    }
  );

  // Control video playback based on isVideoPlaying prop
  useEffect(() => {
    if (post?.mediaType === 'video' && videoPlayer) {
      if (isVideoPlaying) {
        videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
    }
  }, [isVideoPlaying, post?.mediaType, videoPlayer]);

  // Control video mute state
  useEffect(() => {
    if (post?.mediaType === 'video' && videoPlayer) {
      videoPlayer.muted = isVideoMuted || false;
    }
  }, [isVideoMuted, post?.mediaType, videoPlayer]);

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
            isFrontCamera={post.isFrontCamera}
            style={styles.media}
            onDoubleTap={handleDoubleTap}
            onLoad={() => setIsMediaLoading(false)}
            showBorderRadius={showImageBorderRadius}
            likeAnimationOpacity={likeAnimationOpacity}
            likeAnimationScale={likeAnimationScale}
            isVideoPlaying={isVideoPlaying}
            isVideoMuted={isVideoMuted}
            onVideoMuteToggle={onVideoMuteToggle}
            videoPlayer={videoPlayer}
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