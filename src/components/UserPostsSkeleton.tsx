import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { useAppSelector } from '../hooks/redux';
import { SPACING } from '../config/constants';
import { getTheme } from '../theme';

const { width } = Dimensions.get('window');

interface UserPostsSkeletonProps {
  count?: number;
}

export default function UserPostsSkeleton({ count = 9 }: UserPostsSkeletonProps) {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const currentTheme = getTheme(isDarkMode);

  const renderSkeletonGridItem = (index: number) => {
    const itemWidth = Math.floor((width - 4) / 3); // 3 columns with proper spacing
    const itemHeight = Math.floor((itemWidth * 3) / 2); // 2:3 aspect ratio (width:height)

    return (
      <View
        key={index}
        style={[
          {
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: '32%',
            maxWidth: itemWidth,
            height: itemHeight,
            marginRight: (index + 1) % 3 === 0 ? 0 : 2,
            marginBottom: 2,
            backgroundColor: currentTheme.skeleton,
            overflow: 'hidden',
          }
        ]}
      >
        <SkeletonLoader
          width={itemWidth}
          height={itemHeight}
          borderRadius={0}
        />
      </View>
    );
  };

  const renderProfileHeader = () => (
    <View style={[styles.profileHeader, { backgroundColor: currentTheme.surface, marginHorizontal: 16 }]}>
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
      <View style={styles.gridContainer}>
        {Array.from({ length: 9 }, (_, index) => renderSkeletonGridItem(index))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 2,
    justifyContent: 'flex-start',
  },
  gridSkeletonItem: {
    backgroundColor: '#f0f0f0',
  },
});