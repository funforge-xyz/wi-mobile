import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';

import { FONTS, SPACING } from '../config/constants';
import { Notification } from '../utils/notificationsUtils';

interface NotificationItemProps {
  item: Notification;
  currentTheme: any;
  formatTimeAgo: (date: Date) => string;
  onPress: (notification: Notification) => void;
  onDelete: (notification: Notification) => void;
  isLastItem?: boolean;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like':
      return 'heart';
    case 'comment':
      return 'chatbubble';
    case 'nearby_request':
      return 'people';
    default:
      return 'notifications';
  }
};

const getNotificationIconColor = (type: string) => {
  switch (type) {
    case 'like':
      return COLORS.error;
    case 'comment':
      return COLORS.primary;
    case 'nearby_request':
      return '#9b59b6';
    default:
      return COLORS.primary;
  }
};

const itemStyles = {
  notificationItem: {
    marginVertical: SPACING.xs,
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  notificationItemLast: {
    marginVertical: SPACING.xs,
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  notificationDetails: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: SPACING.sm,
  },
  deleteButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
};

const NotificationItem = ({ 
  item, 
  currentTheme, 
  formatTimeAgo, 
  onPress,
  onDelete,
  isLastItem = false
}: NotificationItemProps) => {
  return (
    <TouchableOpacity 
      style={[
        isLastItem ? itemStyles.notificationItemLast : itemStyles.notificationItem,
        { borderBottomColor: currentTheme.border }
      ]}
      onPress={() => onPress(item)}
    >
      <View style={itemStyles.notificationContent}>
        <View style={[
          itemStyles.iconContainer, 
          { backgroundColor: getNotificationIconColor(item.type) }
        ]}>
          <Ionicons 
            name={getNotificationIcon(item.type)} 
            size={18} 
            color="white" 
          />
        </View>

        <View style={itemStyles.notificationDetails}>
          <Text style={[
            itemStyles.notificationTitle, 
            { 
              color: currentTheme.text,
              fontWeight: !item.read ? 'bold' : 'normal'
            }
          ]}>
            {item.title}
          </Text>
          <Text style={[
            itemStyles.notificationBody, 
            { 
              color: currentTheme.textSecondary,
              fontWeight: !item.read ? '500' : 'normal'
            }
          ]}>
            {item.body}
          </Text>
          <Text style={[itemStyles.notificationTime, { color: currentTheme.textSecondary }]}>
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>

        {!item.read && (
          <View style={[itemStyles.unreadIndicator, { backgroundColor: COLORS.primary }]} />
        )}
        
        <TouchableOpacity
          style={itemStyles.deleteButton}
          onPress={() => onDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color={currentTheme.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default NotificationItem;