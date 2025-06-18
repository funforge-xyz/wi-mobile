
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SPACING } from '../config/constants';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostMedia from './PostMedia';
import PostActions from './PostActions';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  mediaURL?: string;
  mediaType?: 'image' | 'video';
  createdAt: Date;
  showLikeCount: boolean;
  allowComments: boolean;
  isPrivate?: boolean;
}

interface SinglePostDisplayProps {
  post: Post;
  liked: boolean;
  likesCount: number;
  commentsCount: number;
  onLikePress: () => void;
  onCommentPress: () => void;
  currentTheme: any;
}

export default function SinglePostDisplay({
  post,
  liked,
  likesCount,
  commentsCount,
  onLikePress,
  onCommentPress,
  currentTheme,
}: SinglePostDisplayProps) {
  return (
    <View style={[styles.postContainer, { backgroundColor: currentTheme.surface }]}>
      <PostHeader
        authorName={post.authorName}
        authorPhotoURL={post.authorPhotoURL}
        createdAt={post.createdAt}
        isAuthorOnline={false}
        isFromConnection={false}
        currentTheme={currentTheme}
      />

      {post.content ? (
        <PostContent
          content={post.content}
          currentTheme={currentTheme}
        />
      ) : null}

      {post.mediaURL && (
        <PostMedia mediaURL={post.mediaURL} />
      )}

      <PostActions
        liked={liked}
        likesCount={likesCount}
        commentsCount={commentsCount}
        showLikeCount={post.showLikeCount}
        allowComments={post.allowComments}
        onLikePress={onLikePress}
        onCommentPress={onCommentPress}
        currentTheme={currentTheme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  postContainer: {
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: 12,
  },
});
