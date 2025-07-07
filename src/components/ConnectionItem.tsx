import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../config/constants';
import { FONTS, SPACING } from '../config/constants';
import UserAvatar from './UserAvatar';

interface Connection {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio: string;
  connectedAt: Date;
  lastMessage?: string;
  lastMessageTime?: Date;
  isOnline?: boolean;
  unreadCount?: number;
}

interface ConnectionItemProps {
  item: Connection;
  onStartChat: (connection: Connection) => void;
  onBlock: (connection: Connection) => void;
  formatTimeAgo: (date: Date) => string;
  currentTheme: any;
  isLastItem?: boolean;
}

export default function ConnectionItem({
  item,
  onStartChat,
  onBlock,
  formatTimeAgo,
  currentTheme,
  isLastItem = false,
}: ConnectionItemProps) {
  const { t } = useTranslation();
  const displayName = item.firstName && item.lastName 
    ? `${item.firstName} ${item.lastName}` 
    : 'Anonymous User';

  return (
    <TouchableOpacity
      style={[
        styles.userItem, 
        { 
          borderBottomColor: currentTheme.border,
          borderBottomWidth: isLastItem ? 0 : 1
        }
      ]}
      onPress={() => onStartChat(item)}
    >
      <View style={styles.chatAvatar}>
        <UserAvatar
          photoURL={item.photoURL}
          size={50}
          currentTheme={currentTheme}
        />
        {item.isOnline === true && (
          <View style={[styles.onlineIndicator, { borderColor: currentTheme.background }]} />
        )}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.nameRow}>
          <Text style={[styles.participantName, { color: currentTheme.text }]}>
            {displayName}
          </Text>
        </View>

        {item.lastMessage && item.lastMessage.length > 0 && (
          <View style={styles.messageRow}>
            <Text style={[
              styles.lastMessage, 
              { color: currentTheme.textSecondary },
              typeof item.unreadCount === 'number' && item.unreadCount > 0 && { 
                fontWeight: 'bold', 
                fontFamily: FONTS.bold 
              }
            ]} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {item.lastMessageTime && (
              <Text style={[styles.timeText, { color: currentTheme.textSecondary }]}>
                {formatTimeAgo(item.lastMessageTime)}
              </Text>
            )}
          </View>
        )}
      </View>

      {typeof item.unreadCount === 'number' && item.unreadCount > 0 && (
        <View style={[styles.unreadDot, { backgroundColor: COLORS.primary }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = {
  userItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    width: '100%',
  },
  chatAvatar: {
    marginRight: SPACING.md,
  },
  onlineIndicator: {
    position: 'absolute' as const,
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
  },
  chatContent: {
    flex: 1,
    flexDirection: 'column' as const,
    justifyContent: 'center' as const,
    height: '100%',
    gap: SPACING.xs / 2,
  },
  nameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  participantName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.xs / 2,
    marginTop: SPACING.xs / 2,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 18,
    marginRight: SPACING.sm,
    flexShrink: 1,
  },
  timeText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    flexShrink: 0,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: SPACING.sm,
  },
};