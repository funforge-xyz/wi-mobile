
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
}

export default function ConnectionRequestItem({
  item,
  onReply,
  onDecline,
  formatTimeAgo,
  currentTheme,
}: ConnectionRequestItemProps) {
  const displayName = item.firstName && item.lastName 
    ? `${item.firstName} ${item.lastName}` 
    : 'Anonymous User';

  return (
    <View style={[styles.userItem, { backgroundColor: currentTheme.surface }]}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <UserAvatar
            photoURL={item.photoURL}
            size={50}
            currentTheme={currentTheme}
          />
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: currentTheme.text }]}>
            {displayName}
          </Text>
          <Text style={[styles.timeText, { color: currentTheme.textSecondary }]}>
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
      </View>
      <View style={styles.connectionActions}>
        <TouchableOpacity
          style={styles.messageIconButton}
          onPress={() => onReply(item)}
        >
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => onDecline(item)}
        >
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
  userItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: SPACING.md,
    borderRadius: 12,
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative' as const,
    marginRight: SPACING.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  connectionActions: {
    flexDirection: 'row' as const,
    gap: SPACING.xs,
  },
  messageIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: COLORS.surface,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
};
