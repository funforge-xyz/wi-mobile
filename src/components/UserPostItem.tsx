import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../config/constants';
import AvatarImage from './AvatarImage';
import PostMedia from './PostMedia';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/redux';
import { FONTS } from '../config/constants';

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
  onDelete?: (post: any) => void;
  showDeleteButton?: boolean;
}

export default function UserPostItem({ 
  item, 
  currentTheme, 
  styles, 
  onPress, 
  onLike, 
  formatTimeAgo,
  onDelete,
  showDeleteButton = false
}: UserPostItemProps) {
  const { t } = useTranslation();

  // Get the latest post data from Redux to ensure real-time updates
  const userPosts = useAppSelector((state) => state.user.posts);
  const currentPost = userPosts.find(post => post.id === item.id);

  // Use Redux state for commentsCount to get real-time updates
  const commentsCount = currentPost?.commentsCount ?? item.commentsCount;

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
        <PostMedia
          mediaURL={item.mediaURL}
          mediaType={item.mediaType}
          style={styles.postMedia}
        />
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
              {commentsCount}
            </Text>
          </TouchableOpacity>
        )}
      </View>
       {showDeleteButton && onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
          >
            <Ionicons name="trash-outline" size={20} color="white" />
          </TouchableOpacity>
        )}
    </TouchableOpacity>
  );
}