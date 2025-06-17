
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/NearbyStyles';

interface NearbyEmptyStateProps {
  currentTheme: any;
  t: (key: string) => string;
}

export default function NearbyEmptyState({
  currentTheme,
  t,
}: NearbyEmptyStateProps) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="people-outline"
        size={64}
        color={currentTheme.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
        {t('nearby.noUsers')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
        {t('nearby.checkBackLater')}
      </Text>
    </View>
  );
}
