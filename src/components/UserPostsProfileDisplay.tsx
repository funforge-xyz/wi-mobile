;
import { View, Text, Image, TouchableOpacity } from 'react-native';
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

interface UserPostsProfileDisplayProps {
  profile: any;
  posts: any[];
  currentTheme: any;
  styles: any;
  onConnectionsPress?: () => void;
}

export default function UserPostsProfileDisplay({
  profile,
  posts,
  currentTheme,
  styles,
  onConnectionsPress,
}: UserPostsProfileDisplayProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.profileHeader, { paddingHorizontal: 16 }]}>
      <View style={styles.profileRow}>
        {(profile?.thumbnailURL || profile?.photoURL) && (profile?.thumbnailURL || profile?.photoURL)?.trim() !== '' ? (
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
            <TouchableOpacity 
            style={styles.statItem}
            onPress={onConnectionsPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.statNumber, { color: currentTheme.text }]}>
              {profile?.connectionsCount || 0}
            </Text>
            <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
              {t('profile.connections')}
            </Text>
          </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}