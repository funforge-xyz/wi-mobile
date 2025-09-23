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
  navigation?: any;
}

export default function ConnectionItem({
  item,
  onStartChat,
  onBlock,
  formatTimeAgo,
  currentTheme,
  isLastItem = false,
  navigation,
}: ConnectionItemProps) {
  const { t } = useTranslation();
  const displayName = item.firstName && item.lastName 
    ? `${item.firstName} ${item.lastName}` 
    : 'Anonymous User';

  const handleProfilePress = () => {
    if (navigation && item.userId) {
      navigation.navigate('UserProfile', {
        userId: item.userId,
        firstName: item.firstName || '',
        lastName: item.lastName || '',
        photoURL: item.photoURL || '',
        bio: item.bio || '',
      });
    }
  };

  return (
    <View
      style={[
        styles.userItem, 
        { 
          borderBottomColor: currentTheme.border,
          borderBottomWidth: isLastItem ? 0 : 1
        }
      ]}
    >
      <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.7} style={styles.profileSection}>
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

        <View style={styles.nameSection}>
          <Text style={[styles.participantName, { color: currentTheme.text }]}>
            {displayName}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.chatContent} onPress={() => onStartChat(item)} activeOpacity={0.7}>
        <View style={styles.messageSection}>

          {item.lastMessage && item.lastMessage.length > 0 ? (
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
          ) : (
            <Text style={[styles.tapToChatText, { color: currentTheme.textSecondary }]}>
              {t('connections.tapToChat')}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {typeof item.unreadCount === 'number' && item.unreadCount > 0 && (
        <View style={[styles.unreadDot, { backgroundColor: COLORS.primary }]} />
      )}
    </View>
  );
}

const styles = {
  userItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    width: '100%' as const,
  },
  profileSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 0,
    marginRight: SPACING.md,
  },
  nameSection: {
    marginLeft: SPACING.sm,
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
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
  },
  messageSection: {
    flex: 1,
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
  tapToChatText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    fontStyle: 'italic' as const,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: SPACING.sm,
  },
};