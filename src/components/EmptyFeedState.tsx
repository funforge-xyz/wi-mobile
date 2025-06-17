
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING } from '../config/constants';
import { useTranslation } from 'react-i18next';

interface EmptyFeedStateProps {
  currentTheme: any;
  title?: string;
  subtitle?: string;
  icon?: string;
}

export default function EmptyFeedState({ 
  currentTheme, 
  title, 
  subtitle, 
  icon = "newspaper-outline" 
}: EmptyFeedStateProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon as any} size={64} color={currentTheme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
        {title || t('feed.noPosts')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
        {subtitle || t('feed.shareFirst')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 24,
  },
});
