
import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { useAppSelector } from '../hooks/redux';
import { SPACING } from '../config/constants';
import { getTheme } from '../theme';

export default function SinglePostSkeleton() {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const currentTheme = getTheme(isDarkMode);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <SkeletonLoader width={24} height={24} borderRadius={12} />
        <View style={{ flex: 1 }} />
        <SkeletonLoader width={24} height={24} borderRadius={12} />
      </View>

      {/* Post Header with padding - matches SinglePostDisplay headerContainer */}
      <View style={[styles.headerContainer, { backgroundColor: currentTheme.background }]}>
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            <SkeletonLoader
              width={40}
              height={40}
              borderRadius={20}
              style={styles.avatar}
            />
            <View style={styles.authorDetails}>
              <SkeletonLoader
                width={120}
                height={16}
                borderRadius={8}
                style={styles.authorName}
              />
              <SkeletonLoader
                width={80}
                height={12}
                borderRadius={6}
                style={styles.timestamp}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Post Content with padding - matches SinglePostDisplay contentContainer */}
      <View style={[styles.contentContainer, { backgroundColor: currentTheme.background }]}>
        <SkeletonLoader
          width="100%"
          height={16}
          borderRadius={8}
          style={styles.contentLine}
        />
        <SkeletonLoader
          width="80%"
          height={16}
          borderRadius={8}
          style={styles.contentLine}
        />
      </View>

      {/* Post Media - Full width, no padding, 4:5 aspect ratio - matches SinglePostDisplay mediaContainer */}
      <View style={styles.mediaContainer}>
        <SkeletonLoader
          width="100%"
          height="100%"
          borderRadius={0}
          style={styles.postMedia}
        />
      </View>

      {/* Post Actions with padding - matches SinglePostDisplay actionsContainer */}
      <View style={[styles.actionsContainer, { backgroundColor: currentTheme.background }]}>
        <View style={styles.actionRow}>
          <View style={styles.actionItem}>
            <SkeletonLoader
              width={24}
              height={24}
              borderRadius={12}
              style={styles.actionIcon}
            />
            <SkeletonLoader
              width={30}
              height={14}
              borderRadius={7}
              style={styles.actionText}
            />
          </View>
          <View style={styles.actionItem}>
            <SkeletonLoader
              width={24}
              height={24}
              borderRadius={12}
              style={styles.actionIcon}
            />
            <SkeletonLoader
              width={40}
              height={14}
              borderRadius={7}
              style={styles.actionText}
            />
          </View>
        </View>
      </View>

      {/* Comments Section with padding */}
      <View style={[styles.commentsSection, { backgroundColor: currentTheme.background }]}>
        <SkeletonLoader
          width={120}
          height={18}
          borderRadius={9}
          style={styles.commentsTitle}
        />
        
        {/* Comment Items */}
        {Array.from({ length: 3 }, (_, index) => (
          <View key={index} style={styles.commentItem}>
            <SkeletonLoader
              width={32}
              height={32}
              borderRadius={16}
              style={styles.commentAvatar}
            />
            <View style={styles.commentContent}>
              <SkeletonLoader
                width={100}
                height={14}
                borderRadius={7}
                style={styles.commentAuthor}
              />
              <SkeletonLoader
                width="90%"
                height={16}
                borderRadius={8}
                style={styles.commentText}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: SPACING.sm,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    marginBottom: SPACING.xs,
  },
  timestamp: {},
  contentContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  contentLine: {
    marginBottom: SPACING.xs,
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 4/5,
    marginBottom: 0,
  },
  postMedia: {
    marginBottom: 0,
  },
  actionsContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  actionIcon: {
    marginRight: SPACING.xs,
  },
  actionText: {},
  commentsSection: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  commentsTitle: {
    marginBottom: SPACING.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  commentAvatar: {
    marginRight: SPACING.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    marginBottom: SPACING.xs,
  },
  commentText: {},
});
