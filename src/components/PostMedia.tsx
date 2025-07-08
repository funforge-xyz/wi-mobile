import React, { useState, useRef, useEffect } from 'react';
import { Image, TouchableOpacity, StyleSheet, View, Dimensions, TouchableWithoutFeedback, Animated } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
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
  isVideoMuted?: boolean;
  onVideoMuteToggle?: () => void;
  onVideoPlayPause?: () => void;
  videoPlayer?: any;
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
}: PostMediaProps) {
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [hasBeenTapped, setHasBeenTapped] = useState(false);
  const playButtonOpacity = useRef(new Animated.Value(0)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;

  // Use external video player if provided, otherwise create internal one
  const internalVideoPlayer = useVideoPlayer(
    mediaType === 'video' && !videoPlayer ? mediaURL : null,
    (player) => {
      if (player && mediaType === 'video') {
        player.loop = true;
        player.muted = isVideoMuted;
        // Don't auto-play on creation
      }
    }
  );

  const activeVideoPlayer = videoPlayer || internalVideoPlayer;

  // Update video player state when props change
  useEffect(() => {
    if (activeVideoPlayer && mediaType === 'video') {
      activeVideoPlayer.muted = isVideoMuted;
      if (isVideoPlaying) {
        activeVideoPlayer.play();
      } else {
        activeVideoPlayer.pause();
      }
    }
  }, [activeVideoPlayer, isVideoPlaying, isVideoMuted, mediaType]);

  const handleMuteUnmute = () => {
    if (onVideoMuteToggle) {
      onVideoMuteToggle();
    }
  };

  const handlePlayPause = () => {
    if (onVideoPlayPause) {
      onVideoPlayPause();
    }
  };

  const handleMediaLoad = () => {
    console.log('Media loaded:', mediaType, mediaURL);
    setIsMediaLoaded(true);
    onLoad?.();
  };

  if (!mediaURL) return null;

  const mediaStyle = [
    styles.media,
    style,
    showBorderRadius && { borderRadius: 8 }
  ];

  const frontCameraTransform = isFrontCamera ? { transform: [{ scaleX: -1 }] } : {};

  const TouchComponent = onDoubleTap ? TouchableWithoutFeedback : TouchableOpacity;

  const handlePress = () => {
    if (mediaType === 'video') {
      if (onVideoPlayPause) {
        onVideoPlayPause();
      }
      
      // Show play button animation when pausing
      if (isVideoPlaying) {
        setHasBeenTapped(true);
        // Reset and animate play button
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
    if (onDoubleTap) {
      onDoubleTap();
    }
  };

  const touchProps = onDoubleTap
    ? { onPress: handlePress }
    : { onPress: handlePress, activeOpacity: 0.9 };

  if (mediaType === 'video') {
    console.log('Rendering VideoView with player:', !!activeVideoPlayer);

    if (!activeVideoPlayer) {
      console.warn('No video player available for video:', mediaURL);
      return (
        <View style={[styles.mediaContainer, { backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }]}>
          <TouchComponent {...touchProps}>
            <View style={mediaStyle} />
          </TouchComponent>
        </View>
      );
    }

    return (
      <View style={styles.mediaContainer}>
        <TouchComponent {...touchProps}>
          <VideoView
            player={activeVideoPlayer}
            style={[
              mediaStyle,
              isFrontCamera && { transform: [{ scaleX: -1 }] }
            ]}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            nativeControls={false}
            contentFit="contain"
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
        </TouchComponent>

        {/* Centered play button overlay - only show when paused and after first tap */}
        {!isVideoPlaying && hasBeenTapped && (
          <View style={styles.playButtonOverlay}>
            <Ionicons
              name="play"
              size={60}
              color="white"
            />
          </View>
        )}

        {/* Play button animation overlay */}
        {hasBeenTapped && (
          <Animated.View style={[
            styles.playButtonOverlay,
            {
              opacity: playButtonOpacity,
              transform: [{ scale: playButtonScale }]
            }
          ]}>
            <Ionicons
              name="play"
              size={60}
              color="white"
            />
          </Animated.View>
        )}

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
      <TouchComponent {...touchProps}>
        <Image
          source={{ uri: mediaURL }}
          style={[mediaStyle, isFrontCamera && { transform: [{ scaleX: -1 }] }]}
          resizeMode="contain"
          onLoad={handleMediaLoad}
          onError={(error) => {
            console.error('Image load error:', error);
            handleMediaLoad(); // Still call onLoad to hide skeleton
          }}
        />
      </TouchComponent>

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
  video: {
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
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});