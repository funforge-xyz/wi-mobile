
import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { useAppSelector } from '../hooks/redux';
import { SPACING } from '../config/constants';

export default function ProfileSkeleton() {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <SkeletonLoader width={24} height={24} borderRadius={12} />
        <SkeletonLoader width={80} height={20} borderRadius={10} />
        <View style={{ width: 24 }} />
      </View>

      {/* Profile Header */}
      <View style={[styles.profileHeader, { backgroundColor: currentTheme.surface }]}>
        <SkeletonLoader
          width={120}
          height={120}
          borderRadius={60}
          style={styles.avatar}
        />
        
        <SkeletonLoader
          width={180}
          height={24}
          borderRadius={12}
          style={styles.displayName}
        />
        
        <SkeletonLoader
          width={220}
          height={16}
          borderRadius={8}
          style={styles.bio}
        />

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <SkeletonLoader
              width={40}
              height={20}
              borderRadius={10}
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
              height={20}
              borderRadius={10}
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

      {/* Menu Section */}
      <View style={[styles.menuSection, { backgroundColor: currentTheme.surface }]}>
        {Array.from({ length: 4 }, (_, index) => (
          <View key={index} style={styles.menuItem}>
            <SkeletonLoader width={20} height={20} borderRadius={10} />
            <SkeletonLoader
              width={120}
              height={16}
              borderRadius={8}
              style={styles.menuText}
            />
            <SkeletonLoader width={20} height={20} borderRadius={10} />
          </View>
        ))}
      </View>
    </View>
  );
}

const lightTheme = {
  background: '#FFFFFF',
  surface: '#F8F9FA',
  border: '#E5E5E5',
};

const darkTheme = {
  background: '#121212',
  surface: '#1E1E1E',
  border: '#333333',
};

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
  profileHeader: {
    alignItems: 'center',
    padding: SPACING.lg,
    margin: SPACING.md,
    borderRadius: 16,
  },
  avatar: {
    marginBottom: SPACING.md,
  },
  displayName: {
    marginBottom: SPACING.xs,
  },
  bio: {
    marginBottom: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: SPACING.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    marginBottom: SPACING.xs,
  },
  statLabel: {},
  menuSection: {
    margin: SPACING.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  menuText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
});
