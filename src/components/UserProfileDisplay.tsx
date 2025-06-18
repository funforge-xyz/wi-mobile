
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ProfileImage from './ProfileImage';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio: string;
  postsCount: number;
  connectionsCount: number;
}

interface UserProfileDisplayProps {
  profile: UserProfile;
  currentTheme: any;
  styles: any;
}

export default function UserProfileDisplay({ profile, currentTheme, styles }: UserProfileDisplayProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.profileHeader, { backgroundColor: currentTheme.surface }]}>
      {profile.photoURL ? (
        <ProfileImage 
          uri={profile.photoURL} 
          style={styles.avatar} 
        />
      ) : (
        <View style={[styles.avatar, styles.placeholderAvatar, { backgroundColor: currentTheme.surface }]}>
          <Ionicons name="person-add" size={40} color={currentTheme.textSecondary} />
        </View>
      )}

      <Text style={[styles.displayName, { color: currentTheme.text }]}>
        {profile.firstName && profile.lastName 
          ? `${profile.firstName} ${profile.lastName}` 
          : t('userProfile.anonymousUser')}
      </Text>

      {profile.bio ? (
        <Text style={[styles.bio, { color: currentTheme.textSecondary }]}>
          {profile.bio}
        </Text>
      ) : null}
    </View>
  );
}
