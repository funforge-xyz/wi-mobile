import { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '../config/constants';
import SkeletonLoader from './SkeletonLoader';

interface UserAvatarProps {
  photoURL?: string;
  isOnline?: boolean;
  size?: number;
  currentTheme?: any;
  style?: any;
}

export default function UserAvatar({
  photoURL,
  isOnline = false,
  size = 40,
  currentTheme,
  style,
}: UserAvatarProps) {
  // Default theme colors if currentTheme is not provided
  const defaultTheme = {
    border: '#E5E5EA',
    textSecondary: '#8E8E93',
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [photoURL]);

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={[styles.avatarContainer, style]}>
      {loading && !error && (
        <SkeletonLoader
          width={size}
          height={size}
          borderRadius={size / 2}
          style={{ position: 'absolute' }}
        />
      )}
      {photoURL && !error ? (
        <Image
          source={{ uri: photoURL }}
          style={[avatarStyle, { opacity: loading || error ? 0 : 1 }]}
          onLoadStart={() => {
            setLoading(true);
            setError(false);
          }}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      ) : (
        <View style={[avatarStyle, styles.avatarPlaceholder, { backgroundColor: currentTheme?.border || defaultTheme.border }]}>
          <Ionicons name="person" size={size * 0.5} color={currentTheme?.textSecondary || defaultTheme.textSecondary} />
        </View>
      )}
      {isOnline && (
        <View style={[styles.onlineIndicator, {
          bottom: size * 0.05,
          right: size * 0.05,
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: size * 0.15,
        }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});