import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { useAppSelector } from '../hooks/redux';
import { SPACING } from '../config/constants';

interface RequestsSkeletonProps {
  count?: number;
}

export default function RequestsSkeleton({ count = 3 }: RequestsSkeletonProps) {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  const renderSkeletonRequest = (index: number) => (
    <View key={index} style={[styles.requestContainer, { backgroundColor: currentTheme.surface }]}>
      <View style={styles.requestInfo}>
        {/* Avatar */}
        <SkeletonLoader
          width={50}
          height={50}
          borderRadius={25}
          style={styles.avatar}
        />
        
        {/* Request details */}
        <View style={styles.requestDetails}>
          <SkeletonLoader
            width={120}
            height={16}
            borderRadius={8}
            style={styles.requestName}
          />
          <SkeletonLoader
            width={80}
            height={12}
            borderRadius={6}
            style={styles.requestTime}
          />
        </View>
      </View>
      
      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <SkeletonLoader
          width={32}
          height={32}
          borderRadius={16}
          style={styles.actionButton}
        />
        <SkeletonLoader
          width={32}
          height={32}
          borderRadius={16}
          style={styles.actionButton}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => renderSkeletonRequest(index))}
    </View>
  );
}

import { getTheme } from '../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  requestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: SPACING.md,
  },
  requestDetails: {
    flex: 1,
  },
  requestName: {
    marginBottom: SPACING.xs,
  },
  requestTime: {},
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {},
});
