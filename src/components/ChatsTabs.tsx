
import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING } from '../config/constants';

interface ChatsTabsProps {
  showRequests: boolean;
  onTabChange: (showRequests: boolean) => void;
  requestsCount: number;
  chatsLabel: string;
  requestsLabel: string;
  currentTheme: any;
}

export default function ChatsTabs({
  showRequests,
  onTabChange,
  requestsCount,
  chatsLabel,
  requestsLabel,
  currentTheme,
}: ChatsTabsProps) {
  return (
    <View style={[styles.tabsContainer, { backgroundColor: currentTheme.surface }]}>
      <TouchableOpacity
        style={[
          styles.tab,
          !showRequests && [styles.activeTab, { backgroundColor: currentTheme.background }]
        ]}
        onPress={() => onTabChange(false)}
      >
        <Text style={[
          styles.tabText,
          { color: !showRequests ? currentTheme.text : currentTheme.textSecondary }
        ]}>
          {chatsLabel}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          showRequests && [styles.activeTab, { backgroundColor: currentTheme.background }]
        ]}
        onPress={() => onTabChange(true)}
      >
        <Text style={[
          styles.tabText,
          { color: showRequests ? currentTheme.text : currentTheme.textSecondary }
        ]}>
          {requestsLabel}
        </Text>
        {requestsCount > 0 && (
          <View style={[styles.requestsBadge, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.requestsBadgeText}>{requestsCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  tabsContainer: {
    flexDirection: 'row' as const,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 6,
    position: 'relative' as const,
  },
  activeTab: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  requestsBadge: {
    marginLeft: SPACING.xs,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 4,
  },
  requestsBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: 'white',
  },
};
