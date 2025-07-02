import React from 'react';
import { Image, StyleSheet, ViewStyle, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

interface PostMediaProps {
  mediaURL: string;
  mediaType?: 'image' | 'video';
  style?: ViewStyle;
}

export default function PostMedia({ mediaURL, mediaType = 'image', style }: PostMediaProps) {
  const player = useVideoPlayer(mediaURL, player => {
    player.loop = false;
    player.play();
  });

  if (!mediaURL) return null;

  if (mediaType === 'video') {
    return (
      <View style={[styles.media, style]}>
        <VideoView
          player={player}
          style={styles.video}
          allowsFullscreen
          allowsPictureInPicture
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: mediaURL }}
      style={[styles.media, style]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  media: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  video: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
});