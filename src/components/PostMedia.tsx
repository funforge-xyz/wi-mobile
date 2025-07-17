import React, { useState, useRef, useEffect } from 'react';
import { 
  Image, 
  StyleSheet, 
  View, 
  TouchableWithoutFeedback, 
  Animated,
  Text 
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import SkeletonLoader from './SkeletonLoader';

interface PostMediaProps {
  mediaURL: string;
  mediaType?: 'picture' | 'video';
  style?: any;
  showBorderRadius?: boolean;
  onLoad?: () => void;
  isFrontCamera?: boolean;
  onDoubleTap?: () => void;
  likeAnimationOpacity?: any;
  likeAnimationScale?: any;
  isVideoPlaying?: boolean;
  isVideoMuted?: boolean;
  onVideoMuteToggle?: () => void;
  onVideoPlayPause?: () => void;
  videoPlayer?: any;
  isLoading?: boolean;
  postId?: string;
  forceDarkTheme?: boolean;
}

export default function PostMedia({
  mediaURL,
  mediaType,
  style,
  showBorderRadius = true,
  onLoad,
  isFrontCamera,
  onDoubleTap,
  likeAnimationOpacity,
  likeAnimationScale,
  isVideoPlaying,
  isVideoMuted,
  onVideoMuteToggle,
  onVideoPlayPause,
  videoPlayer,
  isLoading = false,
  postId,
  forceDarkTheme = false,
}: PostMediaProps) {
  const [hasBeenTapped, setHasBeenTapped] = useState(false);
  const [lastTap, setLastTap] = useState<number | null>(null);
  const playButtonOpacity = useRef(new Animated.Value(0)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;
  const [externalIsLoading, setExternalIsLoading] = useState(isLoading);
  const lastTapRef = useRef<number | null>(null);
  const [showPauseIndicator, setShowPauseIndicator] = useState(false);
  const [internalIsLoading, setInternalIsLoading] = useState(true);

  // Create video player for video content - only when we have a video
  const shouldCreatePlayer = mediaType === 'video' && mediaURL;
  const internalVideoPlayer = useVideoPlayer(
    shouldCreatePlayer ? mediaURL : '', 
    player => {
      if (player && shouldCreatePlayer) {
        player.loop = true;
        player.muted = isVideoMuted || false;
      }
    }
  );

  // Use the passed videoPlayer prop if available, otherwise use internal
  const activeVideoPlayer = videoPlayer || (shouldCreatePlayer ? internalVideoPlayer : null);



  // Reset hasBeenTapped when video starts playing (autoplay)
  useEffect(() => {
    if (mediaType === 'video' && isVideoPlaying && !hasBeenTapped) {
      console.log('Video autoplaying, hasBeenTapped stays false');
    }
  }, [isVideoPlaying, mediaType, hasBeenTapped]);

  const handleMediaLoad = () => {
    console.log('Media loaded:', mediaType, mediaURL);
    setExternalIsLoading(false);
    setInternalIsLoading(false);
    onLoad?.();
  };

  const handleDoubleTap = () => {
    if (isLoading) return;

    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (lastTapRef.current && (now - lastTapRef.current) < DOUBLE_PRESS_DELAY) {
      // This is a double tap
      console.log('Double tap detected');
      if (onDoubleTap) {
        onDoubleTap();
      }
      setLastTap(null);
      lastTapRef.current = null;
    } else {
      // This is a single tap - handle video play/pause
      setLastTap(now);
      lastTapRef.current = now;

      // Delay single tap action to allow for potential double tap
      setTimeout(() => {
        if (lastTapRef.current === now) {
          // Single tap confirmed
          if (mediaType === 'video') {
            console.log('Single tap on video - toggling play/pause');
            setHasBeenTapped(true);

            if (onVideoPlayPause) {
              onVideoPlayPause();
            }

            // Show play animation when pausing, hide when playing
            if (isVideoPlaying) {
              console.log('Video was playing, showing play button');
              
              playButtonScale.setValue(0);
              playButtonOpacity.setValue(1);

              Animated.timing(playButtonScale, {
                toValue: 1.2,
                duration: 300,
                useNativeDriver: true,
              }).start(() => {
                playButtonScale.setValue(1);
              });
            } else {
              // Video is now playing, hide play button
              console.log('Video is now playing, hiding play button');
              playButtonOpacity.setValue(0);
            }
          }
        }
      }, DOUBLE_PRESS_DELAY);
    }
  };

  

  // Update video player when playback state changes - like in SinglePostDisplay
  useEffect(() => {
    if (activeVideoPlayer && mediaType === 'video' && mediaURL) {
      activeVideoPlayer.muted = isVideoMuted || false;
      if (isVideoPlaying) {
        activeVideoPlayer.play();
      } else {
        activeVideoPlayer.pause();
        // When video is paused programmatically (like losing focus), mark as tapped
        // so the play button shows
        if (!isVideoPlaying) {
          setHasBeenTapped(true);
        }
      }
    }
  }, [activeVideoPlayer, isVideoPlaying, isVideoMuted, mediaType, mediaURL]);

  // Listen to video player events
  // const { isPlaying: videoIsPlaying } = useEvent(videoPlayer, 'playingChange', { isPlaying: videoPlayer?.playing || false });

  if (!mediaURL) return null;

  const mediaStyle = [
    styles.media,
    style,
    showBorderRadius && { borderRadius: 8 }
  ];

  return (
    <View style={styles.mediaContainer}>
      {/* Skeleton loading overlay for all media types */}
      {(mediaType === 'picture' || mediaType === 'image' || mediaType === 'video') && (internalIsLoading || externalIsLoading) && (
        <TouchableWithoutFeedback onPress={handleDoubleTap}>
          <View style={styles.mediaLoadingSkeleton}>
            <SkeletonLoader
              width="100%"
              height="100%"
              borderRadius={showBorderRadius ? 8 : 0}
              forceDarkTheme={forceDarkTheme}
            />
          </View>
        </TouchableWithoutFeedback>
      )}

      {mediaType === 'video' && activeVideoPlayer ? (
          <View style={styles.videoContainer}>
            <TouchableWithoutFeedback onPress={handleDoubleTap}>
              <VideoView
                player={activeVideoPlayer}
                style={[
                  styles.media,
                  isFrontCamera && { transform: [{ scaleX: -1 }] }
                ]}
                allowsFullscreen={false}
                allowsPictureInPicture={false}
                nativeControls={false}
                contentFit="contain"
              />
            </TouchableWithoutFeedback>

          {/* Animated play button overlay - show when video is paused and has been tapped */}
          <Animated.View style={[
            styles.playButtonOverlay,
            {
              opacity: (!isVideoPlaying && hasBeenTapped) ? 1 : 0,
              transform: [{ scale: playButtonScale }]
            }
          ]}>
            <Ionicons
              name="play"
              size={60}
              color="white"
            />
          </Animated.View>

          {/* Animated heart overlay for videos */}
          {onDoubleTap && likeAnimationOpacity && likeAnimationScale && (
            <Animated.View style={[
              styles.likeAnimationOverlay,
              {
                opacity: likeAnimationOpacity,
                transform: [{ scale: likeAnimationScale }]
              }
            ]}>
              <Ionicons name="heart" size={80} color="red" />
            </Animated.View>
          )}
        </View>
      ) : mediaType === 'picture' || mediaType === 'image' ? (
        <View style={styles.imageContainer}>
          <TouchableWithoutFeedback onPress={handleDoubleTap}>
            <Image
              source={{ uri: mediaURL }}
              style={[mediaStyle, isFrontCamera && { transform: [{ scaleX: -1 }] }]}
              resizeMode="contain"
              onLoad={handleMediaLoad}
              onError={(error) => {
                console.warn('PostMedia - Image failed to load:', mediaURL);
                handleMediaLoad(); // Still call onLoad to hide skeleton even on error
              }}
            />
          </TouchableWithoutFeedback>

          {/* Animated heart overlay for pictures */}
          {onDoubleTap && likeAnimationOpacity && likeAnimationScale && (
            <Animated.View style={[
              styles.likeAnimationOverlay,
              {
                opacity: likeAnimationOpacity,
                transform: [{ scale: likeAnimationScale }]
              }
            ]}>
              <Ionicons name="heart" size={80} color="red" />
            </Animated.View>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mediaContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: 'black',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
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
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  likeAnimationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
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