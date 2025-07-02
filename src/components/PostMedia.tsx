import React from 'react';
import { Image, StyleSheet, ViewStyle, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

interface PostMediaProps {
  mediaURL: string;
  mediaType?: 'image' | 'video';
  style?: ViewStyle;
}

export default function PostMedia({ mediaURL, mediaType = 'image', style }: PostMediaProps) {
  if (!mediaURL) return null;

  if (mediaType === 'video') {
    return (
      <View style={[styles.media, style]}>
        <Video
          source={{ uri: mediaURL }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
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