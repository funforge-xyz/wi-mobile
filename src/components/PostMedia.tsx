import React from 'react';
import { Image, StyleSheet, ViewStyle, View, TouchableOpacity } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

interface PostMediaProps {
  mediaURL: string;
  mediaType?: 'image' | 'video';
  style?: ViewStyle;
  thumbnailURL?: string;
  isPlaying?: boolean;
  togglePlay?: () => void;
  post?: any;
  onLoad?: () => void;
}

export default function PostMedia({ mediaURL, mediaType = 'image', style, thumbnailURL, isPlaying, togglePlay, post, onLoad }: PostMediaProps) {
  const player = useVideoPlayer(mediaURL, player => {
    player.loop = false;
    player.play();
  });

  if (!mediaURL) return null;

  if (mediaType === 'video') {
    return (
      <View style={[styles.mediaContainer, style]}>
        {thumbnailURL ? (
          <Image
            source={{ uri: thumbnailURL }}
            style={styles.media}
            resizeMode="contain"
          />
        ) : (
          <VideoView
            player={player}
            style={styles.video}
            allowsFullscreen
            allowsPictureInPicture
          />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.mediaContainer, style]}>
      <Image
        source={{ uri: mediaURL }}
        style={styles.media}
        resizeMode="contain"
        onLoad={onLoad}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mediaContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  media: {
    flex: 1,
    aspectRatio: 1, // Default 1:1 aspect ratio - can be adjusted based on actual image dimensions
    borderRadius: 0,
  },
  video: {
    flex: 1,
    aspectRatio: 16/9, // Default 16:9 aspect ratio for videos
    borderRadius: 0,
  },
});