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
      <View style={[styles.media, style]}>
        {thumbnailURL ? (
          <Image
            source={{ uri: thumbnailURL }}
            style={[styles.media, style]}
            resizeMode="cover"
          />
        ) : (
          <VideoView
            player={player}
            style={[styles.video, style]}
            allowsFullscreen
            allowsPictureInPicture
          />
        )}
      </View>
    );
  }

  return (
    <Image
      source={{ uri: mediaURL }}
      style={[styles.media, style]}
      resizeMode="cover"
      onLoad={onLoad}
    />
  );
}

const styles = StyleSheet.create({
  media: {
    width: '100%',
    minHeight: 200,
    borderRadius: 0,
  },
  video: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
});