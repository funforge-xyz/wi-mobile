
import { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/ProfileStyles';
import SkeletonLoader from './SkeletonLoader';

interface ProfileImageProps {
  uri: string;
  style: any;
  [key: string]: any;
}

const ProfileImage = ({ uri, style, ...props }: ProfileImageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const imageWidth = typeof style?.width === 'number' ? style.width : 120;
  const imageHeight = typeof style?.height === 'number' ? style.height : 120;

  useEffect(() => {
    if (uri && uri.trim() !== '') {
      setLoading(true);
      setError(false);
    } else {
      setLoading(false);
      setError(true);
    }
  }, [uri]);

  if (!uri || uri.trim() === '' || error) {
    return null;
  }

  return (
    <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
      {loading && !error && (
        <SkeletonLoader
          width={imageWidth}
          height={imageHeight}
          borderRadius={style?.borderRadius || 60}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        />
      )}
      <Image
        source={{ uri, cache: 'reload' }}
        style={[style, { opacity: loading ? 0 : 1 }]}
        onLoadStart={() => {
          setLoading(true);
          setError(false);
        }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        {...props}
      />
    </View>
  );
};

interface ProfileInfoProps {
  profile: any;
  currentTheme: any;
  t: (key: string) => string;
}

export default function ProfileInfo({ profile, currentTheme, t }: ProfileInfoProps) {
  return (
    <View style={[styles.profileHeader, { backgroundColor: currentTheme.surface }]}>
      {(profile?.thumbnailURL || profile?.photoURL) && (profile.thumbnailURL || profile.photoURL).trim() !== '' ? (
        <ProfileImage
          uri={profile.thumbnailURL || profile.photoURL}
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.avatar, styles.placeholderAvatar, { backgroundColor: currentTheme.surface }]}>
          <Ionicons name="person-add" size={40} color={currentTheme.textSecondary} />
        </View>
      )}

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
