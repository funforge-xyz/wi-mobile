import React from 'react';
import { View, Text } from 'react-native';
import ProfileImage from './ProfileImage';

interface UserProfileDisplayProps {
  profile: any;
  currentTheme: any;
  styles: any;
}

export default function UserProfileDisplay({ profile, currentTheme, styles }: UserProfileDisplayProps) {
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
          : 'Anonymous User'}
      </Text>

      {profile?.bio ? (
        <Text style={[styles.bio, { color: currentTheme.textSecondary }]}>
          {profile.bio}
        </Text>
      ) : null}
    </View>
  );
}