
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { useAppSelector } from '../hooks/redux';
import { SPACING } from '../config/constants';
import { getTheme } from '../theme';

export default function SettingsSkeleton() {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const currentTheme = getTheme(isDarkMode);

  const renderSection = (itemCount: number, index: number) => (
    <View key={index} style={[styles.section, { backgroundColor: currentTheme.surface }]}>
      <SkeletonLoader
        width={120}
        height={16}
        borderRadius={8}
        style={styles.sectionTitle}
      />
      
      {Array.from({ length: itemCount }, (_, itemIndex) => (
        <View key={itemIndex} style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <SkeletonLoader width={20} height={20} borderRadius={10} style={styles.settingIcon} />
            <View style={styles.settingTextContainer}>
              <SkeletonLoader
                width={140}
                height={16}
                borderRadius={8}
                style={styles.settingTitle}
              />
              <SkeletonLoader
                width={200}
                height={12}
                borderRadius={6}
                style={styles.settingDescription}
              />
            </View>
          </View>
          <SkeletonLoader width={50} height={30} borderRadius={15} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <SkeletonLoader width={24} height={24} borderRadius={12} />
        <SkeletonLoader width={80} height={20} borderRadius={10} />
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Appearance Section */}
        {renderSection(1, 0)}
        
        {/* Language Section */}
        {renderSection(1, 1)}
        
        {/* Location Section */}
        {renderSection(1, 2)}
        
        {/* Notifications Section */}
        {renderSection(1, 3)}
        
        {/* Account Section */}
        {renderSection(3, 4)}
        
        {/* Support Section */}
        {renderSection(2, 5)}
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
  content: {
    flex: 1,
    paddingTop: SPACING.md,
  },
  section: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 12,
    paddingVertical: SPACING.xs,
  },
  sectionTitle: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: SPACING.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    marginBottom: SPACING.xs,
  },
  settingDescription: {},
});
