
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/ProfileStyles';
import ProfileImage from './ProfileImage';

interface ProfileInfoProps {
  profile: any;
  currentTheme: any;
  t: (key: string) => string;
}

export default function ProfileInfo({ profile, currentTheme, t }: ProfileInfoProps) {
  return (
    <View style={[styles.profileHeader, { backgroundColor: currentTheme.surface }]}>
      <ProfileImage
        uri={profile?.thumbnailURL || profile?.photoURL}
        style={styles.avatar}
        showPlaceholder={true}
        placeholderIcon="person"
        placeholderSize={40}
        placeholderBackgroundColor={currentTheme.surface}
        placeholderIconColor={currentTheme.textSecondary}
      />

      <Text style={[styles.displayName, { color: currentTheme.text }]}>
        {profile?.firstName && profile?.lastName
          ? `${profile.firstName} ${profile.lastName}`
          : t('profile.anonymousUser')}
      </Text>

      <Text style={[styles.bio, { color: currentTheme.textSecondary }]}>
        {profile?.bio || ''}
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: currentTheme.text }]}>
            {profile?.postsCount || 0}
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
  );
}
