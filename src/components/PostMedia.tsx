import React from 'react';
import { Image, TouchableOpacity, StyleSheet, View, Dimensions, TouchableWithoutFeedback, Animated } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

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
  likeAnimationScale
}: PostMediaProps) {
  const player = useVideoPlayer(mediaURL, player => {
    player.loop = false;
    player.play();
  });

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
              player={player}
              style={styles.video}
              allowsFullscreen
              allowsPictureInPicture
              contentFit="contain"
            />
          )}
        </View>
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
  }
});