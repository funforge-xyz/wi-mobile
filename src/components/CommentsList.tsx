import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
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
  onLikeComment: (commentId: string, parentCommentId: string | undefined, isCurrentlyLiked: boolean, t: any) => void;
  onReplyToComment: (commentId: string, commentAuthorName: string) => void;
  onShowReplies: (commentId: string) => void;
  currentTheme: any;
  newlyAddedReplyParentId?: string;
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
  newlyAddedReplyParentId,
}: CommentsListProps) {
  const { t } = useTranslation();
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const scrollViewRef = useRef<ScrollView>(null);
  const replyRefs = useRef<Record<string, View | null>>({});

  // Auto-expand replies when a new reply is added
  React.useEffect(() => {
    if (newlyAddedReplyParentId) {
      setExpandedComments(prev => {
        const newSet = new Set(prev);
        newSet.add(newlyAddedReplyParentId);
        return newSet;
      });
    }
  }, [newlyAddedReplyParentId]);

  // Auto-expand when a new reply is added to any comment and scroll to it
  React.useEffect(() => {
    // Check if any comment has replies that should be auto-expanded
    const mainComments = comments.filter(comment => !comment.parentCommentId);
    mainComments.forEach(comment => {
      const hasReplies = comments.some(c => c.parentCommentId === comment.id);
      if (hasReplies && newlyAddedReplyParentId === comment.id) {
        setExpandedComments(prev => {
          const newSet = new Set(prev);
          newSet.add(comment.id);
          return newSet;
        });
        
        // Scroll to bottom after expanding replies to show the new reply
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, 300); // Small delay to ensure the reply container is expanded and rendered
      }
    });
  }, [comments, newlyAddedReplyParentId]);

  const toggleReplies = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

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
    <View 
      key={comment.id} 
      ref={(ref) => {
        if (comment.parentCommentId) {
          replyRefs.current[comment.id] = ref;
        }
      }}
      style={[
        styles.commentItem,
        comment.parentCommentId && styles.replyComment
      ]}
    >
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

        <Text style={[styles.commentText, { color: currentTheme.text }]}>
          {comment.content}
        </Text>

        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.commentActionButton}
            onPress={() => onLikeComment(comment.id, comment.parentCommentId, comment.isLikedByUser || false, t)}
          >
            <Ionicons
              name={comment.isLikedByUser ? "heart" : "heart-outline"}
              size={16}
              color={comment.isLikedByUser ? "red" : currentTheme.textSecondary}
            />
            <Text style={[
              styles.commentActionText, 
              { 
                color: currentTheme.textSecondary,
              }
            ]}>
              {comment.likesCount || 0}
            </Text>
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
              onPress={() => toggleReplies(comment.id)}
            >
              <Text style={[styles.viewRepliesText, { color: COLORS.primary }]}>
                {expandedComments.has(comment.id) ? t('singlePost.hideReplies') : t('singlePost.showReplies')}
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

      <ScrollView 
        ref={scrollViewRef}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
        {mainComments.map(comment => (
          <View key={comment.id} style={styles.commentThread}>
            {renderComment(comment)}

            {/* Replies Section */}
            {repliesMap[comment.id] && repliesMap[comment.id].length > 0 && expandedComments.has(comment.id) && (
              <View style={styles.repliesContainer}>
                {repliesMap[comment.id].map((reply) => renderComment(reply, comment))}
              </View>
            )}
          </View>
        ))}

        {comments.length === 0 && (
          <Text style={[styles.noCommentsText, { color: currentTheme.textSecondary }]}>
            {t('singlePost.noCommentsYet')}
          </Text>
        )}
      </ScrollView>
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
    marginTop: SPACING.xs,
    marginLeft: SPACING.md,
    padding: SPACING.sm,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  replyComment: {
    marginLeft: SPACING.sm,
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

});