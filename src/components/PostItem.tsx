
import { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SPACING } from '../config/constants';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostMedia from './PostMedia';
import PostActions from './PostActions';

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
}

interface PostItemProps {
  post: ConnectionPost;
  onLike: (postId: string, liked: boolean) => void;
  currentTheme: any;
  navigation: any;
}

export default function PostItem({ post, onLike, currentTheme, navigation }: PostItemProps) {
  const [liked, setLiked] = useState(post.isLikedByUser);
  const [likesCount, setLikesCount] = useState(post.likesCount);

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

      {post.mediaURL && post.mediaURL.trim() !== '' && (
        <PostMedia mediaURL={post.mediaURL} />
      )}

      <PostActions
        liked={liked}
        likesCount={likesCount}
        commentsCount={post.commentsCount}
        showLikeCount={post.showLikeCount}
        allowComments={post.allowComments}
        onLikePress={handleLikePress}
        onCommentPress={() => navigation.navigate('SinglePost', { postId: post.id })}
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
});
