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
}: PostMediaProps) {
  const [hasBeenTapped, setHasBeenTapped] = useState(false);
  const [lastTap, setLastTap] = useState<number | null>(null);
  const playButtonOpacity = useRef(new Animated.Value(0)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;
  const [externalIsLoading, setExternalIsLoading] = useState(isLoading);
  const lastTapRef = useRef<number | null>(null);
  const [showPauseIndicator, setShowPauseIndicator] = useState(false);

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

            // Show pause animation when pausing
            if (isVideoPlaying) {
              console.log('Video was playing, showing pause animation');
              setShowPauseIndicator(true);
              
              playButtonScale.setValue(0);
              playButtonOpacity.setValue(1);

              Animated.parallel([
                Animated.timing(playButtonScale, {
                  toValue: 1.2,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(playButtonOpacity, {
                  toValue: 0,
                  duration: 300,
                  delay: 200,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                playButtonScale.setValue(1);
              });
            } else {
              // Video is paused, hide pause indicator when playing
              setShowPauseIndicator(false);
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
                onVideoViewDidMountForInternalPlayer={() => {
                  console.log('PostMedia - VideoView mounted for:', mediaURL);
                  if (isVideoPlaying && activeVideoPlayer) {
                    console.log('PostMedia - Auto-starting video playback');
                    activeVideoPlayer.play();
                  }
                }}
              />
            </TouchableWithoutFeedback>

          {/* Static pause indicator - show when paused and has been tapped */}
          {!isVideoPlaying && (hasBeenTapped || showPauseIndicator) && (
            <View style={styles.playButtonOverlay}>
              <View style={styles.pauseIndicatorContainer}>
                <Ionicons
                  name="play"
                  size={60}
                  color="white"
                />
                <View style={styles.pauseTextContainer}>
                  <Text style={styles.pauseText}>Tap to play</Text>
                </View>
              </View>
            </View>
          )}

          {/* Animated pause button overlay - only for tap-to-pause animation */}
          <Animated.View style={[
            styles.playButtonOverlay,
            {
              opacity: playButtonOpacity,
              transform: [{ scale: playButtonScale }]
            }
          ]}>
            <Ionicons
              name="pause"
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
  pauseIndicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseTextContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  pauseText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
});