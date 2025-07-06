import { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  View,
  Text
} from 'react-native';
import { SPACING } from '../config/constants';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostMedia from './PostMedia';
import PostActions from './PostActions';
import PostDetailsModal from './PostDetailsModal';

const { width } = Dimensions.get('window');

interface ConnectionPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  mediaURL?: string;
  mediaType?: 'image' | 'video';
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
  showLikeCount: boolean;
  allowComments: boolean;
  isLikedByUser: boolean;
  isAuthorOnline: boolean;
  isFromConnection: boolean;
  isFrontCamera?: boolean;
}

interface PostItemProps {
  post: ConnectionPost;
  onLike: (postId: string, liked: boolean) => void;
  currentTheme: any;
  navigation: any;
  showImageBorderRadius?: boolean;
  isVideoPlaying?: boolean;
  isVideoMuted?: boolean;
  onVideoMuteToggle?: (postId: string) => void;
}

export default function PostItem({ 
  post, 
  onLike, 
  currentTheme, 
  navigation, 
  showImageBorderRadius,
  isVideoPlaying = false,
  isVideoMuted = false,
  onVideoMuteToggle
}: PostItemProps) {
  const [liked, setLiked] = useState(post.isLikedByUser);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showPostDetailsModal, setShowPostDetailsModal] = useState(false);

  const handleLikePress = () => {
    onLike(post.id, liked);
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
  };

  return (
    <TouchableOpacity 
      style={[styles.postContainer, { backgroundColor: currentTheme.surface }]}
      onPress={() => navigation.navigate('SinglePost', { postId: post.id })}
      activeOpacity={0.95}
    >
      <PostHeader
        authorName={post.authorName}
        authorPhotoURL={post.authorPhotoURL}
        createdAt={post.createdAt}
        isAuthorOnline={post.isAuthorOnline}
        isFromConnection={post.isFromConnection}
        currentTheme={currentTheme}
      />

      {post.content && (
        <PostContent content={post.content} currentTheme={currentTheme} />
      )}

      {post.mediaURL && (
        <View style={styles.mediaContainer}>
          <PostMedia
            mediaURL={post.mediaURL}
            mediaType={post.mediaType}
            isFrontCamera={post.isFrontCamera}
            style={styles.media}
            showBorderRadius={showImageBorderRadius}
            isVideoPlaying={isVideoPlaying}
            isVideoMuted={isVideoMuted}
            onVideoMuteToggle={onVideoMuteToggle ? () => onVideoMuteToggle(post.id) : undefined}
          />
        </View>
      )}

      <PostActions
        liked={liked}
        likesCount={likesCount}
        commentsCount={post.commentsCount}
        showLikeCount={post.showLikeCount}
        allowComments={post.allowComments}
        onLikePress={handleLikePress}
        onCommentPress={() => setShowPostDetailsModal(true)}
        currentTheme={currentTheme}
      />

      <PostDetailsModal
        visible={showPostDetailsModal}
        onClose={() => setShowPostDetailsModal(false)}
        postId={post.id}
        currentTheme={currentTheme}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  postContainer: {
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  mediaContainer: {
    width: '100%',
    height: 300, // Fixed height for consistent layout
    marginVertical: SPACING.sm,
  },
  media: {
    width: '100%',
    height: '100%',
  },
});