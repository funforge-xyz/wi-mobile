
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useTranslation } from 'react-i18next';
import UserAvatar from './UserAvatar';

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  createdAt: Date;
}

interface CommentsListProps {
  comments: Comment[];
  allowComments: boolean;
  currentUserId?: string;
  postAuthorId?: string;
  onDeleteComment: (commentId: string, commentAuthorId: string) => void;
  currentTheme: any;
}

export default function CommentsList({
  comments,
  allowComments,
  currentUserId,
  postAuthorId,
  onDeleteComment,
  currentTheme,
}: CommentsListProps) {
  const { t } = useTranslation();

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 6) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } else if (diffInDays > 0) {
      return t('time.daysAgo', { count: diffInDays });
    } else if (diffInHours > 0) {
      return t('time.hoursAgo', { count: diffInHours });
    } else if (diffInMinutes > 0) {
      return t('time.minutesAgo', { count: diffInMinutes });
    } else {
      return t('time.justNow');
    }
  };

  const renderComment = (comment: Comment) => (
    <View key={comment.id} style={styles.commentItem}>
      <UserAvatar
        photoURL={comment.authorPhotoURL}
        isOnline={false}
        size={30}
        currentTheme={currentTheme}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentAuthor, { color: currentTheme.text }]}>
            {comment.authorName}
          </Text>
          <Text style={[styles.commentTime, { color: currentTheme.textSecondary }]}>
            {formatTimeAgo(comment.createdAt)}
          </Text>
          {(comment.authorId === currentUserId || postAuthorId === currentUserId) && (
            <TouchableOpacity 
              onPress={() => onDeleteComment(comment.id, comment.authorId)}
              style={styles.deleteCommentButton}
            >
              <Ionicons name="trash-outline" size={14} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.commentText, { color: currentTheme.text }]}>
          {comment.content}
        </Text>
      </View>
    </View>
  );

  if (!allowComments) {
    return (
      <View style={[styles.commentsSection, { backgroundColor: currentTheme.surface }]}>
        <Text style={[styles.commentsDisabledText, { color: currentTheme.textSecondary }]}>
          {t('singlePost.commentsDisabled')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.commentsSection, { backgroundColor: currentTheme.surface }]}>
      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
        {t('singlePost.comments')} ({comments.length})
      </Text>

      {comments.map(renderComment)}

      {comments.length === 0 && (
        <Text style={[styles.noCommentsText, { color: currentTheme.textSecondary }]}>
          {t('singlePost.noCommentsYet')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  commentsSection: {
    margin: SPACING.md,
    marginTop: 0,
    padding: SPACING.md,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  commentContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  commentAuthor: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginRight: SPACING.sm,
  },
  commentTime: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  commentText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  noCommentsText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: SPACING.lg,
  },
  commentsDisabledText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: SPACING.lg,
  },
  deleteCommentButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
});
