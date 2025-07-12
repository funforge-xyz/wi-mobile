import { useState, useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { getUnreadNotificationsCount } from '../services/notifications';
import { useAppSelector } from '../hooks/redux';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getFirestore, getAuth } from '../services/firebase';

interface NotificationBellProps {
  onPress: () => void;
}

const NotificationBell = ({ onPress }: NotificationBellProps) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const setupNotificationListener = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
          setUnreadCount(0);
          return;
        }

        const firestore = getFirestore();
        const notificationsQuery = query(
          collection(firestore, 'notifications'),
          where('targetUserId', '==', currentUser.uid),
          where('read', '==', false)
        );

        // Set up real-time listener for unread notifications
        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
          setUnreadCount(snapshot.size);
        }, (error) => {
          console.error('Error listening to notifications:', error);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up notification listener:', error);
        return undefined;
      }
    };

    let unsubscribe: (() => void) | undefined;

    setupNotificationListener().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default NotificationBell;

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
    let unsubscribe: (() => void) | undefined;

    const setupRealtimeListener = async () => {
      try {
        const { getAuth } = await import('../services/firebase');
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
          setUnreadCount(0);
          return;
        }

        const firestore = getFirestore();

        // Set up real-time listener for unread notifications
        const notificationsQuery = query(
          collection(firestore, 'notifications'),
          where('targetUserId', '==', currentUser.uid),
          where('read', '==', false)
        );

        unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
          setUnreadCount(snapshot.size);
        });

      } catch (error) {
        console.error('Error setting up notification listener:', error);
        // Fallback to periodic updates
        loadUnreadCount();
      }
    };

    setupRealtimeListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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
            {unreadCount > 100 ? '100+' : unreadCount}
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