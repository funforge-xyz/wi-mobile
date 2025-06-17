import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import { useTranslation } from 'react-i18next';
import { styles, lightTheme, darkTheme } from '../styles/NotificationsStyles';
import { 
  Notification, 
  loadNotifications, 
  markAsRead, 
  markAllAsRead, 
  formatTimeAgo 
} from '../utils/notificationsUtils';
import NotificationsHeader from '../components/NotificationsHeader';
import NotificationItem from '../components/NotificationItem';
import NotificationsEmptyState from '../components/NotificationsEmptyState';

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    const setupAuthListener = async () => {
      try {
        const { getAuth } = await import('../services/firebase');
        const auth = getAuth();

        const unsubscribe = auth.onAuthStateChanged((user: any) => {
          if (user) {
            handleLoadNotifications();
          } else {
            setLoading(false);
            setNotifications([]);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up auth listener:', error);
        setLoading(false);
      }
    };

    let unsubscribe: (() => void) | undefined;

    setupAuthListener().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleLoadNotifications = async () => {
    try {
      setLoading(true);
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.log('No current user found');
        setLoading(false);
        return;
      }

      const notificationsData = await loadNotifications(currentUser);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(notifications);
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      await markAsRead(notification.id);

      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );

      if (notification.type === 'like' || notification.type === 'comment') {
        navigation.navigate('SinglePost', { postId: notification.postId });
      } else if (notification.type === 'nearby_request') {
        navigation.navigate('Chat', {
          userId: notification.fromUserId,
          userName: notification.fromUserName,
          userPhotoURL: notification.fromUserPhotoURL
        });
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await handleLoadNotifications();
    setRefreshing(false);
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <NotificationItem
      item={item}
      currentTheme={currentTheme}
      formatTimeAgo={(date) => formatTimeAgo(date, t)}
      onPress={handleNotificationPress}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <NotificationsHeader
          currentTheme={currentTheme}
          t={t}
          onGoBack={() => navigation.goBack()}
          onMarkAllRead={handleMarkAllAsRead}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <NotificationsHeader
        currentTheme={currentTheme}
        t={t}
        onGoBack={() => navigation.goBack()}
        onMarkAllRead={handleMarkAllAsRead}
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={<NotificationsEmptyState currentTheme={currentTheme} t={t} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContent}
      />
    </SafeAreaView>
  );
}