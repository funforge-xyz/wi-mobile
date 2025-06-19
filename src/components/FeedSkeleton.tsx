
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { useAppSelector } from '../hooks/redux';
import { SPACING } from '../config/constants';
import { getTheme } from '../theme';

const { width } = Dimensions.get('window');

interface FeedSkeletonProps {
  count?: number;
}

export default function FeedSkeleton({ count = 3 }: FeedSkeletonProps) {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const currentTheme = getTheme(isDarkMode);

  const renderSkeletonPost = (index: number) => (
    <View key={index} style={[styles.postContainer, { backgroundColor: currentTheme.surface }]}>
      {/* Header with avatar and user info */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <SkeletonLoader
            width={40}
            height={40}
            borderRadius={20}
            style={styles.avatar}
          />
          <View style={styles.userTextInfo}>
            <SkeletonLoader
              width={120}
              height={16}
              borderRadius={8}
              style={styles.username}
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

      {/* Post content text */}
      <View style={styles.contentContainer}>
        <SkeletonLoader
          width={width - (SPACING.md * 2)}
          height={16}
          borderRadius={8}
          style={styles.contentLine}
        />
        <SkeletonLoader
          width={width - (SPACING.md * 4)}
          height={16}
          borderRadius={8}
          style={styles.contentLine}
        />
      </View>

      {/* Post image */}
      <SkeletonLoader
        width={width}
        height={300}
        borderRadius={0}
        style={styles.postImage}
      />

      {/* Actions (like, comment) */}
      <View style={styles.actionsContainer}>
        <View style={styles.actionItem}>
          <SkeletonLoader
            width={24}
            height={24}
            borderRadius={12}
            style={styles.actionIcon}
          />
          <SkeletonLoader
            width={20}
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
            width={15}
            height={14}
            borderRadius={7}
            style={styles.actionText}
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => renderSkeletonPost(index))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  postContainer: {
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: SPACING.sm,
  },
  userTextInfo: {
    flex: 1,
  },
  username: {
    marginBottom: SPACING.xs,
  },
  timestamp: {},
  contentContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  contentLine: {
    marginBottom: SPACING.xs,
  },
  postImage: {
    marginBottom: SPACING.sm,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
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
});
