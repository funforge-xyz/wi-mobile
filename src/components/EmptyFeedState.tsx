import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING } from '../config/constants';
import { useTranslation } from 'react-i18next';
import { locationService } from '../services/locationService';

interface EmptyFeedStateProps {
  currentTheme: any;
  title?: string;
  subtitle?: string;
  icon?: string;
  onLocationEnabled?: () => void;
}

export default function EmptyFeedState({ 
  currentTheme, 
  title, 
  subtitle, 
  icon = "newspaper-outline",
  onLocationEnabled
}: EmptyFeedStateProps) {
  const { t } = useTranslation();

  const handleEnableLocation = async () => {
    try {
      const hasPermissions = await locationService.requestPermissions();
      if (hasPermissions) {
        // Start location tracking
        await locationService.startLocationTracking();
        // Notify parent component to refresh the feed
        if (onLocationEnabled) {
          onLocationEnabled();
        }
      }
    } catch (error) {
      console.error('Error enabling location:', error);
    }
  };

  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon as any} size={64} color={currentTheme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
        {title || t('feed.noPosts')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
        {subtitle || t('feed.shareFirst')}
      </Text>
      <TouchableOpacity 
        style={[styles.locationButton, { backgroundColor: currentTheme.primary }]}
        onPress={handleEnableLocation}
      >
        <Text style={[styles.locationButtonText, { color: currentTheme.buttonText }]}>
          {t('feed.empty.enableLocation')}
        </Text>
      </TouchableOpacity>
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
    marginBottom: SPACING.lg,
  },
  locationButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.md,
  },
  locationButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
});