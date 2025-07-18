import {
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
} from 'react-native';
import { SPACING } from '../config/constants';
import { VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostMedia from './PostMedia';
import PostActions from './PostActions';
import React, { useEffect, useState, useRef } from 'react';
import SkeletonLoader from './SkeletonLoader';

const { width } = Dimensions.get('window');

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  mediaURL?: string;
  mediaType?: 'image' | 'video';
  createdAt: Date;
  showLikeCount: boolean;
  allowComments: boolean;
  isPrivate?: boolean;
  isFrontCamera?: boolean;
}

interface SinglePostDisplayProps {
  post: Post;
  liked: boolean;
  likesCount: number;
  commentsCount: number;
  onLikePress: () => void;
  onCommentPress: () => void;
  currentTheme: any;
  videoPlayer?: any;
  isVideoPlaying?: boolean;
  isVideoLoading?: boolean;
  isVideoMuted?: boolean;
  onVideoPlayPause?: () => void;
  onVideoMuteToggle?: () => void;
}

export default function SinglePostDisplay({
  post,
  liked,
  likesCount,
  commentsCount,
  onLikePress,
  onCommentPress,
  currentTheme,
  videoPlayer,
  isVideoPlaying,
  isVideoLoading,
  isVideoMuted,
  onVideoPlayPause,
  onVideoMuteToggle,
}: SinglePostDisplayProps) {
  const [isMediaLoading, setIsMediaLoading] = useState(!!post.mediaURL);
  const [lastTap, setLastTap] = useState<number | null>(null);
  const likeAnimationScale = useRef(new Animated.Value(1)).current;
  const likeAnimationOpacity = useRef(new Animated.Value(0)).current;

  console.log('SinglePostDisplay - isMediaLoading:', isMediaLoading, 'mediaType:', post.mediaType, 'mediaURL:', !!post.mediaURL);
  console.log('SinglePostDisplay - post.isFrontCamera:', post.isFrontCamera);
  console.log('SinglePostDisplay - videoPlayer:', !!videoPlayer, 'isVideoPlaying:', isVideoPlaying, 'isVideoLoading:', isVideoLoading);

  useEffect(() => {
    if (!isVideoLoading) {
      setIsMediaLoading(!!isVideoLoading);
    }
  }, [isVideoLoading]);

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
    if(isMediaLoading) return;
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      // This is a double tap - only like if not already liked
      if (!liked) {
        onLikePress();
        triggerLikeAnimation();
      }
      setLastTap(null);
    } else {
      // This is a single tap - record the time
      setLastTap(now);
    }
  };

  return (
    <View style={{ backgroundColor: currentTheme.background }}>
      {/* Header with padding */}
      <View style={styles.headerContainer}>
        <PostHeader
          authorName={post.authorName}
          authorPhotoURL={post.authorPhotoURL}
          createdAt={post.createdAt}
          isAuthorOnline={false}
          isFromConnection={false}
          currentTheme={currentTheme}
        />
      </View>

      {/* Content with padding */}
      {post.content ? (
        <View style={styles.contentContainer}>
          <PostContent
            content={post.content}
            currentTheme={currentTheme}
          />
        </View>
      ) : null}

      {/* Media - Full width, no padding, 4:5 aspect ratio */}
      {post.mediaURL && (
        <View style={styles.mediaContainer}>
          {/* Skeleton loading overlay for videos */}
          {post.mediaType === 'video' && isMediaLoading && (
            <View style={styles.mediaLoadingSkeleton}>
              <SkeletonLoader
                width="100%"
                height="100%"
                borderRadius={0}
                forceDarkTheme={false}
              />
            </View>
          )}
          
          {post.mediaType === 'video' && videoPlayer ? (
            <View style={styles.videoContainer}>
              <TouchableWithoutFeedback onPress={handleDoubleTap}>
                <VideoView
                  player={videoPlayer}
                  style={[
                    styles.video,
                    post.isFrontCamera && { transform: [{ scaleX: -1 }] }
                  ]}
                  allowsFullscreen={false}
                  allowsPictureInPicture={false}
                  nativeControls={false}
                  contentFit="cover"
                />
              </TouchableWithoutFeedback>

              {/* Animated heart overlay for video */}
              <Animated.View style={[
                styles.likeAnimationOverlay,
                {
                  opacity: likeAnimationOpacity,
                  transform: [{ scale: likeAnimationScale }]
                }
              ]}>
                <Ionicons name="heart" size={80} color="red" />
              </Animated.View>

              {/* Video Controls Overlay */}
              {!isMediaLoading && (
                <View style={styles.videoControls}>
                  {/* Play/Pause Button */}
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={onVideoPlayPause}
                  >
                    <Ionicons 
                      name={isVideoPlaying ? "pause" : "play"} 
                      size={30} 
                      color="white" 
                    />
                  </TouchableOpacity>

                  {/* Mute/Unmute Button */}
                  <TouchableOpacity
                    style={styles.muteButton}
                    onPress={onVideoMuteToggle}
                  >
                    <Ionicons 
                      name={isVideoMuted ? "volume-mute" : "volume-high"} 
                      size={24} 
                      color="white" 
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <PostMedia
              mediaURL={post.mediaURL}
              mediaType={post.mediaType}
              isFrontCamera={post.isFrontCamera}
              style={styles.media}
              showBorderRadius={false}
              onLoad={() => setIsMediaLoading(false)}
              onDoubleTap={handleDoubleTap}
              likeAnimationOpacity={likeAnimationOpacity}
              likeAnimationScale={likeAnimationScale}
              isVideoPlaying={false}
              isVideoMuted={false}
              forceDarkTheme={false}
            />
          )}
        </View>
      )}

      {/* Actions with padding */}
      <View style={styles.actionsContainer}>
        <PostActions
          liked={liked}
          likesCount={likesCount}
          commentsCount={commentsCount}
          showLikeCount={post.showLikeCount}
          allowComments={post.allowComments}
          onLikePress={onLikePress}
          onCommentPress={onCommentPress}
          currentTheme={currentTheme}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  postContainer: {
    margin: SPACING.md,
    padding: SPACING.md,
    paddingBottom: 0,
    borderRadius: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: SPACING.sm,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  contentContainer: {
    marginBottom: SPACING.sm,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 4/5,
    marginBottom: SPACING.md,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: 'black',
  },
  media: {
    width: '100%',
    height: '100%',
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
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  headerContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  likeAnimationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'none',
  },
});