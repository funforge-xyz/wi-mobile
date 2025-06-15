import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import { useTranslation } from 'react-i18next';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'nearby_request';
  title: string;
  body: string;
  postId?: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhotoURL: string;
  createdAt: Date;
  read: boolean;
}

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
            loadNotifications();
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

  const loadNotifications = async () => {
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

      const firestore = getFirestore();

      // Simple query without orderBy to avoid index issues
      const notificationsQuery = query(
        collection(firestore, 'notifications'),
        where('targetUserId', '==', currentUser.uid)
      );

      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notificationsData: Notification[] = [];

      notificationsSnapshot.forEach((doc) => {
        const data = doc.data();
        notificationsData.push({
          id: doc.id,
          type: data.type,
          title: data.title,
          body: data.body,
          postId: data.postId,
          fromUserId: data.fromUserId,
          fromUserName: data.fromUserName,
          fromUserPhotoURL: data.fromUserPhotoURL || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          read: data.read || false,
        });
      });

      // Sort client-side by createdAt descending
      notificationsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const firestore = getFirestore();
      const notificationRef = doc(firestore, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const firestore = getFirestore();
      const unreadNotifications = notifications.filter(n => !n.read);

      // Update all unread notifications
      const updatePromises = unreadNotifications.map(notification => {
        const notificationRef = doc(firestore, 'notifications', notification.id);
        return updateDoc(notificationRef, { read: true });
      });

      await Promise.all(updatePromises);

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark as read
      await markAsRead(notification.id);

      // Update local state immediately
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );

      // Navigate based on type
      if (notification.type === 'like' || notification.type === 'comment') {
        navigation.navigate('SinglePost', { postId: notification.postId });
      } else if (notification.type === 'nearby_request') {
        // Navigate directly to chat with the requesting user
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

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return t('time.daysAgo', { count: diffInDays });
    } else if (diffInHours > 0) {
      return t('time.hoursAgo', { count: diffInHours });
    } else if (diffInMinutes > 0) {
      return t('time.minutesAgo', { count: diffInMinutes });
    } else {
      return t('time.justNow');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

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

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { 
          backgroundColor: currentTheme.surface,
          borderLeftWidth: !item.read ? 4 : 0,
          borderLeftColor: !item.read ? COLORS.primary : 'transparent',
        },
        !item.read && { 
          backgroundColor: currentTheme.unreadBackground,
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={[styles.iconContainer, { backgroundColor: getNotificationIconColor(item.type) }]}>
          <Ionicons 
            name={getNotificationIcon(item.type)} 
            size={18} 
            color="white" 
          />
        </View>

        <View style={styles.notificationDetails}>
          <Text style={[
            styles.notificationTitle, 
            { 
              color: currentTheme.text,
              fontWeight: !item.read ? 'bold' : 'normal'
            }
          ]}>
            {item.title}
          </Text>
          <Text style={[
            styles.notificationBody, 
            { 
              color: currentTheme.textSecondary,
              fontWeight: !item.read ? '500' : 'normal'
            }
          ]}>
            {item.body}
          </Text>
          <Text style={[styles.notificationTime, { color: currentTheme.textSecondary }]}>
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>

        {!item.read && (
          <View style={[styles.unreadIndicator, { backgroundColor: COLORS.primary }]} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color={currentTheme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>{t('notifications.noNotifications')}</Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
        {t('notifications.checkBackLater')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{t('notifications.title')}</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={[styles.markAllText, { color: COLORS.primary }]}>{t('notifications.markAllRead')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContent}
      />
    </SafeAreaView>
  );
}

const lightTheme = {
  background: COLORS.background,
  surface: COLORS.surface,
  text: COLORS.text,
  textSecondary: COLORS.textSecondary,
  border: COLORS.border,
  unreadBackground: '#E3F2FD',
};

const darkTheme = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
  unreadBackground: '#263238',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  markAllText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
  },
  notificationItem: {
    marginVertical: SPACING.xs,
    borderRadius: 12,
    overflow: 'hidden',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
});