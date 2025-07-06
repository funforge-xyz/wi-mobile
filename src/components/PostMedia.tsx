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
  style?: ViewStyle;
  onPress?: () => void;
  isPlaying?: boolean;
  togglePlay?: () => void;
  post?: any;
  onLoad?: () => void;
  onDoubleTap?: () => void;
  likeAnimationOpacity?: Animated.Value;
  likeAnimationScale?: Animated.Value;
  isMuted?: boolean;
  toggleMute?: () => void;
}

export default function PostMedia({ 
  mediaURL, 
  mediaType = 'image', 
  thumbnailURL, 
  isFrontCamera, 
  style, 
  onPress,
  isPlaying,
  togglePlay,
  post,
  onLoad,
  onDoubleTap,
  likeAnimationOpacity,
  likeAnimationScale,
  isMuted,
  toggleMute
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

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (status.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };
  
  const handleMuteUnmute = async () => {
    if (videoRef.current) {
      await videoRef.current.setIsMutedAsync(!isMuted);
      toggleMute && toggleMute();
    }
  };

  if (!mediaURL) return null;

  const mediaStyle = [
    style,
    isFrontCamera && { transform: [{ scaleX: -1 }] }
  ];

  const TouchComponent = onDoubleTap ? TouchableWithoutFeedback : TouchableOpacity;

  const touchProps = onDoubleTap 
    ? { onPress: onDoubleTap }
    : { onPress: onPress, activeOpacity: 0.9 };


  if (mediaType === 'video') {
    return (
      <View style={styles.mediaContainer}>
      <TouchComponent {...touchProps}>
        <View style={[styles.mediaContainer, mediaStyle]}>
          {thumbnailURL ? (
            <Image
              source={{ uri: thumbnailURL }}
              style={styles.media}
              resizeMode="contain"
              onLoad={onLoad}
            />
          ) : (
            <VideoView
              ref={videoRef}
              style={styles.video}
              allowsFullscreen
              allowsPictureInPicture
              contentFit="contain"
              source={{ uri: mediaURL }}
              shouldPlay={isPlaying}
              isMuted={isMuted}
              onLoad={() => onLoad && onLoad()}
              onPlaybackStatusUpdate={status => setStatus(() => status)}
            />
          )}
        </View>
      </TouchComponent>
                <View style={styles.videoControls}>
                  <TouchableOpacity onPress={handlePlayPause}>
                    <Ionicons
                      name={status.isPlaying ? 'pause' : 'play'}
                      size={30}
                      color="white"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleMuteUnmute}>
                    <Ionicons
                      name={isMuted ? 'volume-mute' : 'volume-high'}
                      size={30}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>      
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
  videoControls: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
});