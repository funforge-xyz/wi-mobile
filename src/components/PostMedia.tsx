import React, { useState, useRef, useEffect } from 'react';
import { Image, TouchableOpacity, StyleSheet, View, Dimensions, TouchableWithoutFeedback, Animated } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

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
  likeAnimationScale
}: PostMediaProps) {
  const videoRef = useRef<VideoView>(null);
  const [status, setStatus] = useState({});

  useEffect(() => {
    return () => {
      // Stop the video when the component unmounts
      if (videoRef.current) {
        (async () => {
          await videoRef.current.unloadAsync();
        })();
      }
    };
  }, []);

  const handleMuteUnmute = () => {
    if (onVideoMuteToggle) {
      onVideoMuteToggle();
    }
  };

  if (!mediaURL) return null;

  const mediaStyle = [
    styles.media,
    style,
    isFrontCamera && { transform: [{ scaleX: -1 }] },
    showBorderRadius && { borderRadius: 8 }
  ];

  const TouchComponent = onDoubleTap ? TouchableWithoutFeedback : TouchableOpacity;

  const touchProps = onDoubleTap 
    ? { onPress: onDoubleTap }
    : { onPress: onPress, activeOpacity: 0.9 };

  if (mediaType === 'video') {
    return (
      <View style={styles.mediaContainer}>
        <TouchComponent {...touchProps}>
          <VideoView
            ref={videoRef}
            style={mediaStyle}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            contentFit="cover"
            source={{ uri: mediaURL }}
            shouldPlay={isVideoPlaying}
            isMuted={isVideoMuted}
            onLoad={() => onLoad && onLoad()}
            onPlaybackStatusUpdate={status => setStatus(() => status)}
          />
        </TouchComponent>
        
        {isVideoPlaying && onVideoMuteToggle && (
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
          style={mediaStyle}
          resizeMode="cover"
          onLoad={() => {
            console.log('Image loaded successfully');
            onLoad?.();
          }}
          onError={(error) => {
            console.log('Image load error:', error);
            onLoad?.();
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