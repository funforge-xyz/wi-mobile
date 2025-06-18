
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../config/constants';
import AvatarImage from './AvatarImage';
import SkeletonLoader from './SkeletonLoader';

const PostImage = ({ source, style, ...props }: { source: any; style: any; [key: string]: any }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { width } = Dimensions.get('window');
  const imageWidth = width - (SPACING.md * 4);
  const imageHeight = typeof style?.height === 'number' ? style.height : 200;

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [source?.uri]);

  return (
    <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
      {loading && !error && (
        <SkeletonLoader
          width={imageWidth}
          height={imageHeight}
          borderRadius={style?.borderRadius || 8}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        />
      )}
      <Image
        source={source}
        style={[style, { opacity: loading ? 0 : 1 }]}
        onLoadStart={() => {
          setLoading(true);
          setError(false);
        }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        resizeMode='cover'
        {...props}
      />
    </View>
  );
};

interface UserPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  mediaURL?: string;
  mediaType?: 'image' | 'video';
  createdAt: Date | string;
  likesCount: number;
  commentsCount: number;
  showLikeCount: boolean;
  allowComments: boolean;
  isPrivate: boolean;
  isLikedByUser?: boolean;
}

interface UserPostItemProps {
  item: UserPost;
  currentTheme: any;
  styles: any;
  onPress: () => void;
  onLike: (postId: string) => void;
  formatTimeAgo: (date: string | Date) => string;
  t: (key: string, fallback?: string) => string;
}

export default function UserPostItem({ 
  item, 
  currentTheme, 
  styles, 
  onPress, 
  onLike, 
  formatTimeAgo, 
  t 
}: UserPostItemProps) {
  return (
    <TouchableOpacity
      style={[styles.postItem, { backgroundColor: currentTheme.surface }]}
      onPress={onPress}
    >
      <View style={styles.postHeader}>
        <View style={styles.postAuthorInfo}>
          {item.authorPhotoURL ? (
            <AvatarImage
              source={{ uri: item.authorPhotoURL }}
              style={styles.postAuthorAvatar}
            />
          ) : (
            <View style={[styles.postAuthorAvatar, styles.postAuthorAvatarPlaceholder, { backgroundColor: currentTheme.border }]}>
              <Ionicons name="person" size={20} color={currentTheme.textSecondary} />
            </View>
          )}
          <View>
            <Text style={[styles.postAuthorName, { color: currentTheme.text }]}>
              {item.authorName}
            </Text>
            <View style={styles.postMetaInfo}>
              <Text style={[styles.postTime, { color: currentTheme.textSecondary }]}>
                {formatTimeAgo(item.createdAt)}
              </Text>
              {item.isPrivate && (
                <View style={styles.privateIndicator}>
                  <Ionicons name="lock-closed" size={12} color={currentTheme.textSecondary} />
                  <Text style={[styles.privateText, { color: currentTheme.textSecondary }]}>{t('addPost.private', 'Private')}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {item.content ? (
        <Text style={[styles.postContent, { color: currentTheme.text }]} numberOfLines={3}>
          {item.content}
        </Text>
      ) : null}

      {item.mediaURL && (
        <View style={{ marginBottom: SPACING.sm }}>
          <PostImage
            source={{ uri: item.mediaURL }}
            style={styles.postMedia}
          />
        </View>
      )}

      <View style={styles.postStats}>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => onLike(item.id)}
        >
          <Ionicons 
            name={item.isLikedByUser ? "heart" : "heart-outline"} 
            size={16} 
            color={item.isLikedByUser ? COLORS.error : currentTheme.textSecondary} 
          />
          <Text style={[styles.statText, { color: currentTheme.textSecondary }]}>
            {item.likesCount}
          </Text>
        </TouchableOpacity>
        {item.allowComments && (
          <TouchableOpacity style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={16} color={currentTheme.textSecondary} />
            <Text style={[styles.statText, { color: currentTheme.textSecondary }]}>
              {item.commentsCount}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
