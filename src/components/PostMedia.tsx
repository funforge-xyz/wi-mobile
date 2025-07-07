import React, { useState, useRef, useEffect } from 'react';
import { Image, TouchableOpacity, StyleSheet, View, Dimensions, TouchableWithoutFeedback, Animated } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

interface PostMediaProps {
  mediaURL: string;
  mediaType?: 'image' | 'video';
  thumbnailURL?: string;
  isFrontCamera?: boolean;
  style?: any;
  onPress?: () => void;
  isVideoPlaying?: boolean;
  isVideoMuted?: boolean;
  onVideoMuteToggle?: () => void;
  showBorderRadius?: boolean;
  onLoad?: () => void;
  onDoubleTap?: () => void;
  likeAnimationOpacity?: Animated.Value;
  likeAnimationScale?: Animated.Value;
  videoPlayer?: any;
}

export default function PostMedia({ 
  mediaURL, 
  mediaType = 'image', 
  thumbnailURL, 
  isFrontCamera, 
  style, 
  onPress,
  isVideoPlaying = false,
  isVideoMuted = false,
  onVideoMuteToggle,
  showBorderRadius = true,
  onLoad,
  onDoubleTap,
  likeAnimationOpacity,
  likeAnimationScale,
  videoPlayer
}: PostMediaProps) {
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  
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

  console.log('PostMedia - Video Debug:', {
    mediaType,
    hasMediaURL: !!mediaURL,
    hasVideoPlayer: !!videoPlayer,
    hasInternalPlayer: !!internalVideoPlayer,
    hasActivePlayer: !!activeVideoPlayer,
    isVideoPlaying
  });

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

  const touchProps = onDoubleTap 
    ? { onPress: onDoubleTap }
    : { onPress: onPress, activeOpacity: 0.9 };

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
        </TouchComponent>
        
        {onVideoMuteToggle && (
          <TouchableOpacity 
            style={styles.muteButton} 
            onPress={handleMuteUnmute}
          >
            <Ionicons
              name={isVideoMuted ? 'volume-mute' : 'volume-high'}
              size={24}
              color="white"
            />
          </TouchableOpacity>
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
          resizeMode="cover"
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
  muteButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});