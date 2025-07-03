
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
        <SkeletonLoader width={100} height={18} borderRadius={9} />
        <View style={{ width: 24 }} />
      </View>

      {/* Post Container */}
      <View style={[styles.postContainer, { backgroundColor: currentTheme.surface }]}>
        {/* Post Header */}
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

        {/* Post Content */}
        <View style={styles.contentContainer}>
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
      </View>

      {/* Post Media - Full width */}
      <SkeletonLoader
        width="100%"
        height={300}
        borderRadius={0}
        style={styles.postMedia}
      />

      {/* Post Actions Container */}
      <View style={[styles.actionsOuterContainer, { backgroundColor: currentTheme.surface }]}>
        <View style={styles.actionsContainer}>
          <View style={styles.actionItem}>
            <SkeletonLoader
              width={20}
              height={20}
              borderRadius={10}
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
              width={20}
              height={20}
              borderRadius={10}
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

      {/* Comments Section */}
      <View style={[styles.commentsSection, { backgroundColor: currentTheme.surface }]}>
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
  postContainer: {
    margin: SPACING.md,
    padding: SPACING.md,
    paddingBottom: 0,
    borderRadius: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
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
    marginBottom: SPACING.md,
  },
  contentLine: {
    marginBottom: SPACING.xs,
  },
  postMedia: {
    marginBottom: 0,
  },
  actionsOuterContainer: {
    margin: SPACING.md,
    marginTop: 0,
    padding: SPACING.md,
    borderRadius: 16,
  },
  actionsContainer: {
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
    margin: SPACING.md,
    marginTop: 0,
    padding: SPACING.md,
    borderRadius: 16,
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
