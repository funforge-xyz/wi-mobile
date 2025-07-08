import React, { useState, useRef, useEffect } from 'react';
import { Image, StyleSheet, View, Animated, TouchableWithoutFeedback } from 'react-native';
import { VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

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
  videoPlayer?: any;
  onVideoTap?: () => void;
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
  isVideoPlaying = false,
  videoPlayer,
  onVideoTap,
}: PostMediaProps) {
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [hasBeenTapped, setHasBeenTapped] = useState(false);
  const playButtonOpacity = useRef(new Animated.Value(0)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;

  console.log('PostMedia render - mediaType:', mediaType, 'isVideoPlaying:', isVideoPlaying, 'hasVideoPlayer:', !!videoPlayer);

  // Handle media loading
  const handleMediaLoad = () => {
    console.log('Media loaded:', mediaType, mediaURL);
    setIsMediaLoaded(true);
    onLoad?.();
  };

  // Reset tapped state when video starts playing (autoplay)
  useEffect(() => {
    if (mediaType === 'video' && isVideoPlaying && !hasBeenTapped) {
      // This is autoplay, don't show any buttons
      console.log('Video autoplay detected, not showing controls');
    }
  }, [isVideoPlaying, hasBeenTapped, mediaType]);

  const handlePress = () => {
    console.log('PostMedia handlePress called - mediaType:', mediaType);

    if (mediaType === 'video') {
      // Always set hasBeenTapped to true on any tap
      setHasBeenTapped(true);
      console.log('Setting hasBeenTapped to true');

      // Call video tap handler
      if (onVideoTap) {
        onVideoTap();
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

    // Handle double tap for likes
    if (onDoubleTap) {
      onDoubleTap();
    }
  };

  if (!mediaURL) return null;

  const mediaStyle = [
    styles.media,
    style,
    showBorderRadius && { borderRadius: 8 }
  ];

  const frontCameraTransform = isFrontCamera ? { transform: [{ scaleX: -1 }] } : {};

  if (mediaType === 'video') {
    console.log('Rendering VideoView with player:', !!videoPlayer);

    if (!videoPlayer) {
      console.warn('No video player available for video:', mediaURL);
      return (
        <View style={[styles.mediaContainer, { backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }]}>
          <TouchableWithoutFeedback onPress={handlePress}>
            <View style={mediaStyle} />
          </TouchableWithoutFeedback>
        </View>
      );
    }

    return (
      <View style={styles.mediaContainer}>
        <TouchableWithoutFeedback onPress={handlePress}>
          <VideoView
            player={videoPlayer}
            style={[
              mediaStyle,
              frontCameraTransform
            ]}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            nativeControls={false}
            contentFit="cover"
            onLoadStart={() => {
              console.log('Video load started for:', mediaURL);
            }}
            onLoad={() => {
              console.log('Video loaded successfully:', mediaURL);
              handleMediaLoad();
            }}
            onError={(error) => {
              console.error('Video load error for:', mediaURL, error);
              handleMediaLoad(); // Still call onLoad to hide skeleton
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

        {/* Animated heart overlay */}
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
    );
  }

  return (
    <View style={styles.mediaContainer}>
      <TouchableWithoutFeedback onPress={handlePress}>
        <Image
          source={{ uri: mediaURL }}
          style={[mediaStyle, frontCameraTransform]}
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
  );
}

const styles = StyleSheet.create({
  mediaContainer: {
    width: '100%',
    height: '100%',
  },
  media: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  likeAnimationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
});