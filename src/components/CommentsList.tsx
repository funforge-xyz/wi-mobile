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
  likesCount: number;
  repliesCount: number;
  parentCommentId?: string;
  isLikedByUser?: boolean;
}

interface CommentsListProps {
  comments: Comment[];
  allowComments: boolean;
  currentUserId?: string;
  postAuthorId?: string;
  onDeleteComment: (commentId: string, commentAuthorId: string) => void;
  onLikeComment: (commentId: string, parentCommentId: string | undefined, commentId: string) => void;
  onReplyToComment: (commentId: string, commentAuthorName: string) => void;
  onShowReplies: (commentId: string) => void;
  currentTheme: any;
}

export default function CommentsList({
  comments,
  allowComments,
  currentUserId,
  postAuthorId,
  onDeleteComment,
  onLikeComment,
  onReplyToComment,
  onShowReplies,
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

  const renderComment = (comment: Comment, parentComment?: Comment) => (
    <View key={comment.id} style={styles.commentItem}>
      <UserAvatar
        photoURL={comment.authorPhotoURL}
        isOnline={false}
        size={comment.parentCommentId ? 28 : 32}
        currentTheme={currentTheme}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentAuthor, { color: currentTheme.text }]}>
            {comment.authorName}
          </Text>
          {comment.parentCommentId && parentComment && (
            <Text style={[styles.replyLabel, { color: currentTheme.textSecondary }]}>
              • {t('singlePost.replyingTo')} <Text style={{ color: COLORS.primary, fontFamily: FONTS.medium }}>
                {parentComment.authorName}
              </Text>
            </Text>
          )}
          <Text style={[styles.commentTime, { color: currentTheme.textSecondary }]}>
            • {formatTimeAgo(comment.createdAt)}
          </Text>
          {(currentUserId === comment.authorId || currentUserId === postAuthorId) && (
            <TouchableOpacity
              style={styles.deleteCommentButton}
              onPress={() => onDeleteComment(comment.id, comment.authorId, parentComment?.id)}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>

        
        <View style={styles.commentContentRow}>
          {parentComment && (
            <View style={[styles.replyIndicator, { borderLeftColor: COLORS.primary }]}>
              <Ionicons name="return-down-forward" size={14} color={COLORS.primary} style={styles.replyArrow} />
            </View>
          )}
          <Text style={[styles.commentText, { color: currentTheme.text, flex: 1 }]}>
            {comment.content}
          </Text>
        </View>

        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.commentActionButton}
            onPress={() => onLikeComment(comment.id, comment.parentCommentId, comment.id)}
          >
            <Ionicons
              name={comment.isLikedByUser ? "heart" : "heart-outline"}
              size={16}
              color={comment.isLikedByUser ? COLORS.error : currentTheme.textSecondary}
            />
            {comment.likesCount > 0 && (
              <Text style={[styles.commentActionText, { color: currentTheme.textSecondary }]}>
                {comment.likesCount}
              </Text>
            )}
          </TouchableOpacity>

          {!comment.parentCommentId && (
            <TouchableOpacity
              style={styles.commentActionButton}
              onPress={() => onReplyToComment(comment.id, comment.authorName)}
            >
              <Ionicons name="chatbubble-outline" size={16} color={currentTheme.textSecondary} />
              <Text style={[styles.commentActionText, { color: currentTheme.textSecondary }]}>
                {t('singlePost.reply')}
              </Text>
            </TouchableOpacity>
          )}

          {!comment.parentCommentId && comment.repliesCount > 0 && (
            <TouchableOpacity
              style={styles.commentActionButton}
              onPress={() => onShowReplies(comment.id)}
            >
              <Text style={[styles.viewRepliesText, { color: COLORS.primary }]}>
                {t('singlePost.viewReplies', { count: comment.repliesCount })}
              </Text>
            </TouchableOpacity>
          )}
        </View>
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

  // Separate main comments and replies
  const mainComments = comments.filter(comment => !comment.parentCommentId);
  const repliesMap = comments.reduce((acc, comment) => {
    if (comment.parentCommentId) {
      if (!acc[comment.parentCommentId]) {
        acc[comment.parentCommentId] = [];
      }
      acc[comment.parentCommentId].push(comment);
    }
    return acc;
  }, {} as Record<string, Comment[]>);

  return (
    <View style={[styles.commentsSection, { backgroundColor: currentTheme.surface }]}>
      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
        {t('singlePost.comments')} ({comments.length})
      </Text>

      {mainComments.map(comment => (
        <View key={comment.id} style={styles.commentThread}>
          {renderComment(comment)}

          {/* Replies Section */}
          {repliesMap[comment.id] && repliesMap[comment.id].length > 0 && (
            <View style={styles.repliesContainer}>
              <View style={[styles.repliesConnector, { backgroundColor: currentTheme.border }]} />
              <View style={[styles.repliesContent, { borderLeftColor: currentTheme.border }]}>
                {repliesMap[comment.id].map((reply, index) => (
                  <View key={reply.id} style={[
                    styles.replyWrapper,
                    { backgroundColor: currentTheme.background },
                    index === repliesMap[comment.id].length - 1 && styles.lastReply
                  ]}>
                    {renderComment(reply, comment)}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      ))}

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
  commentThread: {
    marginBottom: SPACING.lg,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  repliesContainer: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  repliesConnector: {
    width: 2,
    minHeight: 60,
    marginLeft: 16,
    marginRight: SPACING.md,
    borderRadius: 1,
    opacity: 0.3,
  },
  repliesContent: {
    flex: 1,
    paddingLeft: SPACING.sm,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 4,
  },
  replyWrapper: {
    marginBottom: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
    padding: SPACING.sm,
  },
  lastReply: {
    marginBottom: 0,
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
  },
  replyLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.xs,
  },
  commentTime: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.xs,
  },
  commentText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  commentActionText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.xs,
  },
  viewRepliesText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
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
    marginLeft: 'auto',
    padding: SPACING.xs,
  },
  quotedComment: {
    marginVertical: SPACING.xs,
    padding: SPACING.sm,
    borderLeftWidth: 3,
    borderRadius: 6,
    marginBottom: SPACING.sm,
  },
  quotedAuthor: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.xs,
  },
  quotedText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  commentContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align items to the top
  },
  replyIndicator: {
    marginLeft: 0,
    marginRight: SPACING.sm,
    paddingLeft: SPACING.sm,
    borderLeftWidth: 2,
  },
  replyArrow: {
    marginTop: 2,
  },
});