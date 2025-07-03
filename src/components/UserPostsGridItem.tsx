
import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SkeletonLoader from './SkeletonLoader';

interface UserPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  mediaURL?: string;
  thumbnailURL?: string;
  mediaType?: 'image' | 'video';
  createdAt: Date | string;
  likesCount: number;
  commentsCount: number;
  showLikeCount: boolean;
  allowComments: boolean;
  isPrivate: boolean;
  isLikedByUser?: boolean;
}

interface UserPostsGridItemProps {
  item: UserPost;
  index: number;
  onPress: (post: UserPost) => void;
  currentTheme: any;
  styles: any;
}

const { width } = Dimensions.get('window');

export default function UserPostsGridItem({ 
  item, 
  index, 
  onPress, 
  currentTheme, 
  styles 
}: UserPostsGridItemProps) {
  const [imageLoading, setImageLoading] = useState(true);
  
  const itemWidth = (width - 2) / 3; // 3 columns with 1px gaps
  const itemHeight = (itemWidth * 3) / 2; // 2:3 aspect ratio (height is bigger)
  const thumbnailUrl = item.thumbnailURL || item.mediaURL;
  
  // Debug logging for video thumbnails
  if (item.mediaType === 'video') {
    console.log('Video post:', {
      id: item.id,
      thumbnailURL: item.thumbnailURL,
      mediaURL: item.mediaURL,
      finalUrl: thumbnailUrl,
      fullItem: item
    });
  }
  
  return (
    <TouchableOpacity
      style={[
        styles.gridItem,
        { 
          width: itemWidth, 
          height: itemHeight,
          marginRight: (index + 1) % 3 === 0 ? 0 : 1,
          marginBottom: 1,
        }
      ]}
      onPress={() => onPress(item)}
    >
      {thumbnailUrl ? (
        <>
          {imageLoading && (
            <View style={[
              styles.gridItemSkeleton,
              { 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1
              }
            ]}>
              <SkeletonLoader
                width={itemWidth}
                height={itemHeight}
                borderRadius={0}
              />
            </View>
          )}
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.gridItemImage}
            resizeMode="cover"
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
        </>
      ) : (
        <View style={[styles.gridItemPlaceholder, { backgroundColor: currentTheme.surface }]}>
          <Ionicons 
            name="image-outline" 
            size={24} 
            color={currentTheme.textSecondary} 
          />
        </View>
      )}
      {item.mediaType === 'video' && (
        <View style={styles.videoIndicator}>
          <Ionicons name="play" size={12} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );
}
