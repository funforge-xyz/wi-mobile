
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform
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
  locationPermissionStatus?: 'checking' | 'granted' | 'denied';
  onLocationEnabled?: () => void;
}

export default function EmptyFeedState({ 
  currentTheme, 
  title, 
  subtitle, 
  icon = "newspaper-outline",
  locationPermissionStatus = 'checking',
  onLocationEnabled
}: EmptyFeedStateProps) {
  const { t } = useTranslation();

  // Force dark mode theme for feed screen
  const darkTheme = {
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    primary: '#FA4169',
    buttonText: '#FFFFFF'
  };

  const handleEnableLocation = () => {
    if (onLocationEnabled) {
      onLocationEnabled();
    }
  };

  // Determine what to show based on location status from parent
  const getDisplayContent = () => {
    if (locationPermissionStatus === 'checking') {
      // Still checking permissions
      return {
        title: t('feed.loading'),
        subtitle: t('feed.checkingLocation'),
        showButton: false,
        buttonText: '',
        icon: 'time-outline'
      };
    }

    if (locationPermissionStatus === 'denied') {
      // Location not enabled
      return {
        title: t('feed.empty.locationRequired'),
        subtitle: t('feed.empty.enableLocationDescription', {type: Platform.OS === 'ios' ? 'Always':'Allow all the time'}),
        showButton: true,
        buttonText: t('common.retry'),
        icon: 'location-outline'
      };
    }

    // Location is enabled but no posts
    return {
      title: title || t('feed.noPosts'),
      subtitle: subtitle || t('feed.shareFirst'),
      showButton: false,
      buttonText: '',
      icon: icon
    };
  };

  const content = getDisplayContent();

  return (
    <View style={styles.emptyState}>
      <Ionicons name={content.icon as any} size={64} color={darkTheme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: darkTheme.text }]}>
        {content.title}
      </Text>
      <Text style={[styles.emptySubtitle, { color: darkTheme.textSecondary }]}>
        {content.subtitle}
      </Text>
      {content.showButton && (
        <TouchableOpacity 
          style={[styles.locationButton, { backgroundColor: darkTheme.primary }]}
          onPress={handleEnableLocation}
        >
          <Text style={[styles.locationButtonText, { color: darkTheme.buttonText }]}>
            {content.buttonText}
          </Text>
        </TouchableOpacity>
      )}
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
    textAlign: 'center',
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
