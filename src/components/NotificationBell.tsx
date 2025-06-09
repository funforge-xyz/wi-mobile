
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { getUnreadNotificationsCount } from '../services/notifications';
import { useAppSelector } from '../hooks/redux';

interface NotificationBellProps {
  onPress: () => void;
  size?: number;
  color?: string;
}

export default function NotificationBell({ onPress, size = 24, color }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  
  const bellColor = color || (isDarkMode ? '#FFFFFF' : '#000000');

  useEffect(() => {
    loadUnreadCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationsCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Ionicons 
        name={unreadCount > 0 ? "notifications" : "notifications-outline"} 
        size={size} 
        color={bellColor} 
      />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
