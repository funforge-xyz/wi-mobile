import React from 'react';
import { Image, StyleSheet, ViewStyle, View, TouchableOpacity } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

interface PostMediaProps {
  mediaURL: string;
  mediaType: 'image' | 'video';
  thumbnailURL?: string;
  isFrontCamera?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}

export default function PostMedia({ 
  mediaURL, 
  mediaType, 
  thumbnailURL, 
  isFrontCamera, 
  style, 
  onPress 
}: PostMediaProps) {
  const mediaStyle = [
    style,
    isFrontCamera && { transform: [{ scaleX: -1 }] }
  ];

  if (mediaType === 'image') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <Image
          source={{ uri: mediaURL }}
          style={mediaStyle}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }

  // Video rendering logic would go here
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={mediaStyle}>
        {/* Video player implementation */}
      </View>
    </TouchableOpacity>
  );
}

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
            contentFit="contain"
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
    aspectRatio: 4 / 5, // 4:5 aspect ratio
    borderRadius: 0,
  },
  video: {
    flex: 1,
    aspectRatio: 4 / 5, // 4:5 aspect ratio
    borderRadius: 0,
  },
});