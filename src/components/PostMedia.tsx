import React from 'react';
import { Image, StyleSheet, ViewStyle, View, TouchableOpacity } from 'react-native';
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
  onLoad 
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

  if (mediaType === 'video') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
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
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={[styles.mediaContainer, mediaStyle]}>
        <Image
          source={{ uri: mediaURL }}
          style={styles.media}
          resizeMode="contain"
          onLoad={onLoad}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  mediaContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  media: {
    flex: 1,
    aspectRatio: 4 / 5, // 4:5 aspect ratio
    borderRadius: 0,
  },
  video: {
    flex: 1,
    aspectRatio: 4 / 5, // 4:5 aspect ratio
    borderRadius: 0,
  },
});