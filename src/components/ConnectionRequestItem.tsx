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
          style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
          onPress={() => onReply(item)}
        >
          <Text style={styles.actionButtonText}>
            {t('chats.reply', 'Reply')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.error }]}
          onPress={() => onDecline(item)}
        >
          <Text style={styles.actionButtonText}>
            {t('chats.decline', 'Decline')}
          </Text>
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
  actionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginLeft: SPACING.sm,
  },
  actionButtonText: {
    color: 'white',
    fontFamily: FONTS.medium,
  },
};