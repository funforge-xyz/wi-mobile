import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';

interface ChatEmptyStateProps {
  userName: string;
  currentTheme: any;
  t: (key: string) => string;
}

export default function ChatEmptyState({
  userName,
  currentTheme,
  t,
}: ChatEmptyStateProps) {
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: currentTheme.surface }]}>
        <Ionicons name="chatbubbles-outline" size={48} color={currentTheme.textSecondary} />
      </View>
      <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
        {t('chats.startChatting')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
        {t('chats.sendMessage')} {userName}
      </Text>
      <View style={[styles.emptyHint, { backgroundColor: currentTheme.surface }]}>
        <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
        <Text style={[styles.emptyHintText, { color: currentTheme.textSecondary }]}>
          {t('nearby.sendRequest')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    maxWidth: '90%',
  },
  emptyHintText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.xs,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
});