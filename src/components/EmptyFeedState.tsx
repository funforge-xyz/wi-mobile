
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
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [isLocationTracking, setIsLocationTracking] = useState(false);

  useEffect(() => {
    checkLocationStatus();
  }, []);

  const checkLocationStatus = async () => {
    try {
      const hasPermissions = await locationService.checkPermissions();
      const isTracking = locationService.isLocationTrackingActive();
      
      setHasLocationPermission(hasPermissions);
      setIsLocationTracking(isTracking);
    } catch (error) {
      console.error('Error checking location status:', error);
      setHasLocationPermission(false);
    }
  };

  const handleEnableLocation = async () => {
    try {
      const hasPermissions = await locationService.requestPermissions();
      if (hasPermissions) {
        // Start location tracking
        await locationService.startLocationTracking();
        setHasLocationPermission(true);
        setIsLocationTracking(true);
        // Notify parent component to refresh the feed
        if (onLocationEnabled) {
          onLocationEnabled();
        }
      }
    } catch (error) {
      console.error('Error enabling location:', error);
    }
  };

  // Determine what to show based on location status
  const getDisplayContent = () => {
    if (hasLocationPermission === null) {
      // Still checking permissions
      return {
        title: t('feed.loading'),
        subtitle: t('feed.checkingLocation'),
        showButton: false,
        buttonText: '',
        icon: 'time-outline'
      };
    }

    if (!hasLocationPermission || !isLocationTracking) {
      // Location not enabled
      return {
        title: t('feed.empty.locationRequired'),
        subtitle: t('feed.empty.enableLocationDescription'),
        showButton: true,
        buttonText: t('feed.empty.enableLocation'),
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
      <Ionicons name={content.icon as any} size={64} color={currentTheme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
        {content.title}
      </Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
        {content.subtitle}
      </Text>
      {content.showButton && (
        <TouchableOpacity 
          style={[styles.locationButton, { backgroundColor: currentTheme.primary }]}
          onPress={handleEnableLocation}
        >
          <Text style={[styles.locationButtonText, { color: currentTheme.buttonText }]}>
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
