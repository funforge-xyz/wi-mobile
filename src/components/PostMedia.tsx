
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
  mediaType?: 'image' | 'video';
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
  isVideoLoading?: boolean;
}

export default function PostMedia({
  mediaURL,
  mediaType = 'image',
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
  isVideoLoading,
}: PostMediaProps) {
  const [isMediaLoading, setIsMediaLoading] = useState(!!mediaURL);
  const [hasBeenTapped, setHasBeenTapped] = useState(false);
  const [lastTap, setLastTap] = useState<number | null>(null);
  const playButtonOpacity = useRef(new Animated.Value(0)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;

  console.log('PostMedia - isMediaLoading:', isMediaLoading, 'mediaType:', mediaType, 'isVideoLoading:', isVideoLoading);

  // Handle loading state based on media type and video loading prop
  useEffect(() => {
    if (mediaType === 'video') {
      // For videos, use the isVideoLoading prop from parent
      setIsMediaLoading(!!isVideoLoading);
    } else {
      // For images, keep loading true until onLoad is called
      setIsMediaLoading(!!mediaURL);
    }
  }, [mediaURL, mediaType, isVideoLoading]);

  // Reset hasBeenTapped when video starts playing (autoplay)
  useEffect(() => {
    if (mediaType === 'video' && isVideoPlaying && !hasBeenTapped) {
      console.log('Video autoplaying, hasBeenTapped stays false');
    }
  }, [isVideoPlaying, mediaType, hasBeenTapped]);

  const handleMediaLoad = () => {
    console.log('Media loaded:', mediaType, mediaURL);
    setIsMediaLoading(false);
    onLoad?.();
  };

  const handleDoubleTap = () => {
    if (isMediaLoading) return;
    
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

  if (!mediaURL) return null;

  const mediaStyle = [
    styles.media,
    style,
    showBorderRadius && { borderRadius: 8 }
  ];

  return (
    <View style={styles.mediaContainer}>
      {/* Skeleton loader overlay while loading - always dark for media */}
      {isMediaLoading && (
        <TouchableWithoutFeedback onPress={handleDoubleTap}>
          <View style={styles.mediaLoadingSkeleton}>
            <SkeletonLoader
              width="100%"
              height="100%"
              borderRadius={showBorderRadius ? 8 : 0}
              forceDarkTheme={true}
            />
          </View>
        </TouchableWithoutFeedback>
      )}

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
              contentFit="cover"
            />
          </TouchableWithoutFeedback>

          {/* Static play button overlay - show when paused and tapped */}
          {!isVideoPlaying && hasBeenTapped && !isMediaLoading && (
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
      ) : (
        <View style={styles.imageContainer}>
          <TouchableWithoutFeedback onPress={handleDoubleTap}>
            <Image
              source={{ uri: mediaURL }}
              style={[mediaStyle, isFrontCamera && { transform: [{ scaleX: -1 }] }]}
              resizeMode="cover"
              onLoad={handleMediaLoad}
              onError={(error) => {
                console.error('Image load error:', error);
                handleMediaLoad(); // Still call onLoad to hide skeleton
              }}
            />
          </TouchableWithoutFeedback>

          {/* Animated heart overlay for images */}
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
      )}
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
