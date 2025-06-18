
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AvatarImage from './AvatarImage';

interface UserProfile {
  firstName?: string;
  lastName?: string;
  thumbnailURL?: string;
  photoURL?: string;
  postsCount?: number;
  connectionsCount?: number;
  lastUpdated?: number;
}

interface UserProfileHeaderProps {
  profile: UserProfile | null;
  posts: any[];
  currentTheme: any;
  styles: any;
}

export default function UserProfileHeader({ profile, posts, currentTheme, styles }: UserProfileHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.profileHeader, { backgroundColor: currentTheme.surface }]}>
      <View style={styles.profileRow}>
        {(profile?.thumbnailURL || profile?.photoURL) && (profile.thumbnailURL || profile.photoURL).trim() !== '' ? (
          <AvatarImage
            source={{ 
              uri: profile.thumbnailURL || profile.photoURL,
              cache: 'reload'
            }} 
            style={styles.smallAvatar}
            key={`${profile.thumbnailURL || profile.photoURL}-${profile?.lastUpdated}`}
          />
        ) : (
          <View style={[styles.smallAvatar, styles.placeholderAvatar, { backgroundColor: currentTheme.border }]}>
            <Ionicons name="person" size={24} color={currentTheme.textSecondary} />
          </View>
        )}

        <View style={styles.profileInfo}>
          <Text style={[styles.displayName, { color: currentTheme.text }]}>
            {profile?.firstName && profile?.lastName 
              ? `${profile.firstName} ${profile.lastName}` 
              : t('profile.yourProfile', 'Your Profile')}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: currentTheme.text }]}>
                {profile?.postsCount || posts?.length || 0}
              </Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                {t('profile.posts')}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: currentTheme.text }]}>
                {profile?.connectionsCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                {t('profile.connections')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
