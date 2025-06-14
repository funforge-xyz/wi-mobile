
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { useAppSelector } from '../hooks/redux';
import { SPACING } from '../config/constants';

const { width } = Dimensions.get('window');

interface UserPostsSkeletonProps {
  count?: number;
}

export default function UserPostsSkeleton({ count = 3 }: UserPostsSkeletonProps) {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  const renderSkeletonPost = (index: number) => (
    <View key={index} style={[styles.postContainer, { backgroundColor: currentTheme.surface }]}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.postAuthorInfo}>
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
          width={width - (SPACING.md * 4)}
          height={16}
          borderRadius={8}
          style={styles.contentLine}
        />
        <SkeletonLoader
          width={width - (SPACING.md * 6)}
          height={16}
          borderRadius={8}
          style={styles.contentLine}
        />
      </View>

      {/* Post Media */}
      <SkeletonLoader
        width={width - (SPACING.md * 4)}
        height={200}
        borderRadius={8}
        style={styles.postMedia}
      />

      {/* Post Stats */}
      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <SkeletonLoader
            width={16}
            height={16}
            borderRadius={8}
            style={styles.statIcon}
          />
          <SkeletonLoader
            width={20}
            height={12}
            borderRadius={6}
            style={styles.statText}
          />
        </View>
        <View style={styles.statItem}>
          <SkeletonLoader
            width={16}
            height={16}
            borderRadius={8}
            style={styles.statIcon}
          />
          <SkeletonLoader
            width={15}
            height={12}
            borderRadius={6}
            style={styles.statText}
          />
        </View>
      </View>
    </View>
  );

  const renderProfileHeader = () => (
    <View style={[styles.profileHeader, { backgroundColor: currentTheme.surface }]}>
      <View style={styles.profileRow}>
        <SkeletonLoader
          width={60}
          height={60}
          borderRadius={30}
          style={styles.profileAvatar}
        />
        <View style={styles.profileInfo}>
          <SkeletonLoader
            width={150}
            height={18}
            borderRadius={9}
            style={styles.displayName}
          />
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <SkeletonLoader
                width={40}
                height={18}
                borderRadius={9}
                style={styles.statNumber}
              />
              <SkeletonLoader
                width={50}
                height={14}
                borderRadius={7}
                style={styles.statLabel}
              />
            </View>
            <View style={styles.stat}>
              <SkeletonLoader
                width={40}
                height={18}
                borderRadius={9}
                style={styles.statNumber}
              />
              <SkeletonLoader
                width={80}
                height={14}
                borderRadius={7}
                style={styles.statLabel}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderProfileHeader()}
      {Array.from({ length: count }, (_, index) => renderSkeletonPost(index))}
    </View>
  );
}

const lightTheme = {
  surface: '#FFFFFF',
};

const darkTheme = {
  surface: '#1E1E1E',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  profileHeader: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    marginRight: SPACING.md,
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    marginBottom: SPACING.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  stat: {
    alignItems: 'center',
    marginRight: SPACING.xl,
  },
  statNumber: {
    marginBottom: SPACING.xs,
  },
  statLabel: {},
  postContainer: {
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  postAuthorInfo: {
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
    marginBottom: SPACING.sm,
  },
  contentLine: {
    marginBottom: SPACING.xs,
  },
  postMedia: {
    marginBottom: SPACING.sm,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statIcon: {
    marginRight: SPACING.xs,
  },
  statText: {},
});
