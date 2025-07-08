import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { SPACING } from '../config/constants';

const { width, height } = Dimensions.get('window');

interface FeedSkeletonProps {
  count?: number;
}

export default function FeedSkeleton({ count = 3 }: FeedSkeletonProps) {
  const renderSkeletonPost = (index: number) => (
    <View key={index} style={styles.postContainer}>
      {/* Media takes most of the screen */}
      <SkeletonLoader
        width={width}
        height={height * 0.7}
        borderRadius={0}
        style={styles.postMedia}
        forceDarkTheme={true}
      />

      {/* Bottom overlay with user info and actions */}
      <View style={styles.bottomOverlay}>
        <View style={styles.leftSection}>
          {/* User info */}
          <View style={styles.userInfo}>
            <SkeletonLoader
              width={40}
              height={40}
              borderRadius={20}
              style={styles.avatar}
              forceDarkTheme={true}
            />
            <View style={styles.userTextInfo}>
              <SkeletonLoader
                width={120}
                height={16}
                borderRadius={8}
                style={styles.username}
                forceDarkTheme={true}
              />
              <SkeletonLoader
                width={200}
                height={14}
                borderRadius={7}
                style={styles.description}
                forceDarkTheme={true}
              />
            </View>
          </View>
        </View>

        {/* Right actions */}
        <View style={styles.rightActions}>
          <View style={styles.actionItem}>
            <SkeletonLoader
              width={32}
              height={32}
              borderRadius={16}
              style={styles.actionIcon}
              forceDarkTheme={true}
            />
            <SkeletonLoader
              width={20}
              height={12}
              borderRadius={6}
              style={styles.actionText}
              forceDarkTheme={true}
            />
          </View>
          <View style={styles.actionItem}>
            <SkeletonLoader
              width={32}
              height={32}
              borderRadius={16}
              style={styles.actionIcon}
              forceDarkTheme={true}
            />
            <SkeletonLoader
              width={15}
              height={12}
              borderRadius={6}
              style={styles.actionText}
              forceDarkTheme={true}
            />
          </View>
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
    backgroundColor: 'black',
  },
  postContainer: {
    width: width,
    height: height,
    position: 'relative',
    backgroundColor: 'black',
  },
  postMedia: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
  },
  leftSection: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
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
  description: {
    marginBottom: SPACING.xs,
  },
  rightActions: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingLeft: SPACING.md,
  },
  actionItem: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  actionIcon: {
    marginBottom: SPACING.xs,
  },
  actionText: {},
});