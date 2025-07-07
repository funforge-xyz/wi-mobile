import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING } from '../config/constants';
import UserAvatar from './UserAvatar';

interface ConnectionRequest {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

interface ConnectionRequestItemProps {
  item: ConnectionRequest;
  onReply: (request: ConnectionRequest) => void;
  onDecline: (request: ConnectionRequest) => void;
  formatTimeAgo: (date: Date) => string;
  currentTheme: any;
  isLastItem?: boolean;
}

export default function ConnectionRequestItem({
  item,
  onReply,
  onDecline,
  formatTimeAgo,
  currentTheme,
  isLastItem,
}: ConnectionRequestItemProps) {
  const { t } = useTranslation();
  
  const displayName = item.firstName && item.lastName 
    ? `${item.firstName} ${item.lastName}` 
    : 'Anonymous User';

  return (
    <View style={[
      styles.requestItem, 
      { 
        borderBottomColor: currentTheme.border,
        borderBottomWidth: isLastItem ? 0 : 1
      }
    ]}>
      <View style={styles.requestAvatar}>
        <UserAvatar
          photoURL={item.photoURL}
          size={50}
          currentTheme={currentTheme}
        />
      </View>

      <View style={styles.requestContent}>
        <Text style={[styles.participantName, { color: currentTheme.text }]}>
          {displayName}
        </Text>

        <Text style={[styles.requestTime, { color: currentTheme.textSecondary }]}>
          {formatTimeAgo(item.createdAt)}
        </Text>
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: COLORS.primary }]}
          onPress={() => onReply(item)}
        >
          <Ionicons name="checkmark" size={18} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: COLORS.error }]}
          onPress={() => onDecline(item)}
        >
          <Ionicons name="close" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
  requestItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    width: '100%',
  },
  requestAvatar: {
    marginRight: SPACING.md,
  },
  requestContent: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  requestTime: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  requestActions: {
    flexDirection: 'row' as const,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginLeft: SPACING.sm,
  },
};