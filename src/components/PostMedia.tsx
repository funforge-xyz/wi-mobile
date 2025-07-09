import React, { useState, useRef, useEffect } from 'react';
import { 
  Image, 
  StyleSheet, 
  View, 
  TouchableWithoutFeedback, 
  Animated 
} from 'react-native';
import { VideoView } from 'expo-video';
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
}

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
  isLoading?: boolean; // New prop to control loading from parent
}

export default function PostMedia({
  mediaURL,
  mediaType = 'picture',
  style,
  showBorderRadius = false,
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
  isLoading: externalIsLoading,
}: PostMediaProps) {
  const [hasBeenTapped, setHasBeenTapped] = useState(false);
  const [lastTap, setLastTap] = useState<number | null>(null);
  const playButtonOpacity = useRef(new Animated.Value(0)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;



  // Reset hasBeenTapped when video starts playing (autoplay)
  useEffect(() => {
    if (mediaType === 'video' && isVideoPlaying && !hasBeenTapped) {
      console.log('Video autoplaying, hasBeenTapped stays false');
    }
  }, [isVideoPlaying, mediaType, hasBeenTapped]);

  const handleMediaLoad = () => {
    console.log('Media loaded:', mediaType, mediaURL);
    onLoad?.();
  };

  const handleDoubleTap = () => {
    if (isLoading) return;

    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      // This is a double tap
      if (onDoubleTap) {
        onDoubleTap();
      }
      setLastTap(null);
    } else {
      // This is a single tap - handle video play/pause
      setLastTap(now);

      if (mediaType === 'video') {
        setHasBeenTapped(true);
        console.log('Video tapped, setting hasBeenTapped to true');

        if (onVideoPlayPause) {
          onVideoPlayPause();
        }

        // Show animation when pausing (when currently playing)
        if (isVideoPlaying) {
          console.log('Video was playing, showing pause animation');
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
        }
      }
    }
  };

  // Update video player when playback state changes
  useEffect(() => {
    if (videoPlayer && mediaType === 'video') {
      if (isVideoPlaying) {
        videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
    }
  }, [videoPlayer, isVideoPlaying, mediaType]);

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
      {mediaType === 'video' && videoPlayer ? (
        <View style={styles.videoContainer}>
          <TouchableWithoutFeedback onPress={handleDoubleTap}>
            <VideoView
              player={videoPlayer}
              style={[
                mediaStyle,
                isFrontCamera && { transform: [{ scaleX: -1 }] }
              ]}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
              nativeControls={false}
              contentFit="contain"
              onVideoViewDidMountForInternalPlayer={() => {
                console.log('PostMedia - VideoView mounted for:', mediaURL);
                if (isVideoPlaying && videoPlayer) {
                  console.log('PostMedia - Auto-starting video playback');
                  videoPlayer.play();
                }
              }}
            />
          </TouchableWithoutFeedback>

          {/* Static play button overlay - show when paused and tapped */}
          {!isVideoPlaying && hasBeenTapped && (
            <View style={styles.playButtonOverlay}>
              <Ionicons
                name="play"
                size={60}
                color="white"
              />
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