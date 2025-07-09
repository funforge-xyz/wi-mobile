
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import UserAvatar from './UserAvatar';

interface ChatHeaderProps {
  onBackPress: () => void;
  onHeaderPress: () => void;
  userName: string;
  userPhotoURL?: string;
  userOnlineStatus: boolean;
  currentTheme: any;
  t: (key: string) => string;
}

export default function ChatHeader({
  onBackPress,
  onHeaderPress,
  userName,
  userPhotoURL,
  userOnlineStatus,
  currentTheme,
  t,
}: ChatHeaderProps) {
  return (
    <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
      <TouchableOpacity onPress={onBackPress}>
        <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.headerInfo}
        onPress={onHeaderPress}
      >
        <View style={styles.avatarContainer}>
          <UserAvatar 
            photoURL={userPhotoURL} 
            size={32} 
            currentTheme={currentTheme}
            style={styles.headerAvatar}
          />
          {/* {userOnlineStatus && <View style={[styles.onlineIndicator, { borderColor: currentTheme.background }]} />} */}
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{userName}</Text>
          {/* {userOnlineStatus && (
            <Text style={[styles.onlineStatus, { color: COLORS.success }]}>{t('chat.online')}</Text>
          )} */}
        </View>
      </TouchableOpacity>
      <View style={{ width: 24 }} />
    </View>
  );
}

const styles = {
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    justifyContent: 'center' as const,
  },
  avatarContainer: {
    position: 'relative' as const,
    marginRight: SPACING.sm,
  },
  headerAvatar: {},
  onlineIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    zIndex: 1,
  },
  headerTextContainer: {
    alignItems: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.medium,
  },
  onlineStatus: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
};
