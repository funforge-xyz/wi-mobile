import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useTranslation } from 'react-i18next';
import UserAvatar from './UserAvatar';

interface PostHeaderProps {
  authorName: string;
  authorPhotoURL: string;
  createdAt: Date;
  isAuthorOnline: boolean;
  isFromConnection: boolean;
  currentTheme: any;
  navigation: any;
  authorId: string;
}

export default function PostHeader({
  authorName,
  authorPhotoURL,
  createdAt,
  isAuthorOnline,
  isFromConnection,
  currentTheme,
  navigation,
  authorId,
}: PostHeaderProps) {
  const { t } = useTranslation();

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 6) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } else if (diffInDays > 0) {
      return t('time.daysAgo', { count: diffInDays });
    } else if (diffInHours > 0) {
      return t('time.hoursAgo', { count: diffInHours });
    } else if (diffInMinutes > 0) {
      return t('time.minutesAgo', { count: diffInMinutes });
    } else {
      return t('time.justNow');
    }
  };

  const handleProfilePress = () => {
    if (navigation && authorId) {
      const [firstName, ...lastNameParts] = authorName.split(' ');
      const lastName = lastNameParts.join(' ');

      navigation.navigate('UserProfile', {
        userId: authorId,
        firstName: firstName || '',
        lastName: lastName || '',
        photoURL: authorPhotoURL || '',
      });
    }
  };

  return (
    <View style={styles.postHeader}>
      <View style={styles.userInfo}>
        <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.7}>
          <UserAvatar
            photoURL={authorPhotoURL}
            isOnline={isAuthorOnline}
            size={40}
            currentTheme={currentTheme}
          />
        </TouchableOpacity>
        <View>
          <View style={styles.usernameRow}>
            <Text style={[styles.username, { color: currentTheme.text }]}>{authorName}</Text>
            {isFromConnection && (
              <View style={[styles.connectionPill, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.connectionPillText}>{t('profile.connections')}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.timestamp, { color: currentTheme.textSecondary }]}>
            {formatTimeAgo(createdAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  connectionPill: {
    marginLeft: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  connectionPillText: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
});