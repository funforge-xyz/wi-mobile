import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING } from '../config/constants';

interface ChatsEmptyStateProps {
  showRequests: boolean;
  currentTheme: any;
  t: (key: string, options?: any) => string;
}

export default function ChatsEmptyState({
  showRequests,
  currentTheme,
  t,
}: ChatsEmptyStateProps) {
  const getEmptyStateConfig = () => {
    if (showRequests) {
      return {
        icon: 'mail-outline',
        title: t('chats.noRequests', { defaultValue: 'No Requests' }),
        subtitle: t('chats.noRequestsSubtitle', { defaultValue: 'No connection requests at the moment.' })
      };
    } else {
      return {
        icon: 'people-outline',
        title: t('chats.noConnections', { defaultValue: 'No Connections' }),
        subtitle: t('chats.noConnectionsSubtitle', { defaultValue: 'Start messaging People nearby to build connections.' })
      };
    }
  };

  const config = getEmptyStateConfig();

  return (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={config.icon as any}
        size={64}
        color={currentTheme.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
        {config.title}
      </Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
        {config.subtitle}
      </Text>
    </View>
  );
}

const styles = {
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
};