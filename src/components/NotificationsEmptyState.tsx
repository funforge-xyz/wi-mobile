
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/NotificationsStyles';

interface NotificationsEmptyStateProps {
  currentTheme: any;
  t: any;
}

export default function NotificationsEmptyState({ currentTheme, t }: NotificationsEmptyStateProps) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color={currentTheme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
        {t('notifications.noNotifications')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
        {t('notifications.checkBackLater')}
      </Text>
    </View>
  );
}
