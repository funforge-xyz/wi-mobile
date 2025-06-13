import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import { Settings } from '../services/storage';
import { authService } from '../services/auth';
import { collection, getDocs, doc, getDoc, query, orderBy, limit, where, addDoc, deleteDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import NotificationBell from '../components/NotificationBell';
import SkeletonLoader from '../components/SkeletonLoader';
import NearbySkeleton from '../components/NearbySkeleton';

interface NearbyUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio: string;
  isOnline?: boolean;
}





const AvatarImage = ({ source, style, ...props }: { source: any; style: any; [key: string]: any }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [source?.uri]);

  return (
    <View style={[style, { position: 'relative' }]}>
      {loading && !error && (
        <SkeletonLoader
          width={style?.width || 50}
          height={style?.height || 50}
          borderRadius={style?.borderRadius || 25}
          style={{ position: 'absolute' }}
        />
      )}
      <Image
        source={source}
        style={[style, { opacity: loading || error ? 0 : 1 }]}
        onLoadStart={() => {
          setLoading(true);
          setError(false);
        }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        {...props}
      />
    </View>
  );
};



export default function NearbyScreen({ navigation }: any) {
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await loadNearbyUsers();
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyUsers = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();

      // Get blocked users
      const blockedUsersQuery = query(
        collection(firestore, 'blockedUsers'),
        where('blockerUserId', '==', currentUser.uid)
      );
      const blockedUsersSnapshot = await getDocs(blockedUsersQuery);
      const blockedUserIds = new Set();
      blockedUsersSnapshot.forEach((doc) => {
        blockedUserIds.add(doc.data().blockedUserId);
      });

      // Get users who blocked current user
      const blockedByUsersQuery = query(
        collection(firestore, 'blockedUsers'),
        where('blockedUserId', '==', currentUser.uid)
      );
      const blockedByUsersSnapshot = await getDocs(blockedByUsersQuery);
      blockedByUsersSnapshot.forEach((doc) => {
        blockedUserIds.add(doc.data().blockerUserId);
      });

      // Get connected users
      const connectionsQuery = query(
        collection(firestore, 'connections'),
        where('participants', 'array-contains', currentUser.uid),
        where('status', '==', 'active')
      );
      const connectionsSnapshot = await getDocs(connectionsQuery);
      const connectedUserIds = new Set<string>();
      connectionsSnapshot.forEach((doc) => {
        const connectionData = doc.data();
        const otherParticipant = connectionData.participants.find(
          (id: string) => id !== currentUser.uid
        );
        if (otherParticipant) {
          connectedUserIds.add(otherParticipant);
        }
      });

      const usersCollection = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersCollection);

      const users: NearbyUser[] = [];

      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        // Exclude current user, blocked users, and connected users
        if (doc.id !== currentUser.uid && 
            !blockedUserIds.has(doc.id) && 
            !connectedUserIds.has(doc.id)) {
          
          // Check if user is online (last seen within 2 minutes)
          const isOnline = userData.lastSeen && 
            userData.lastSeen.toDate && 
            (new Date().getTime() - userData.lastSeen.toDate().getTime()) < 2 * 60 * 1000;

          users.push({
            id: doc.id,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            photoURL: userData.thumbnailURL || userData.photoURL || '',
            bio: userData.bio || '',
            isOnline: isOnline || false,
          });
        }
      });

      setNearbyUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUserPress = (user: NearbyUser) => {
    // Navigate to user profile
    navigation.navigate('Profile', { userId: user.id });
  };

  const handleMessageUser = async (user: NearbyUser) => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to send messages');
        return;
      }

      const firestore = getFirestore();

      // Check if there's already a connection or request between users
      const existingConnectionQuery = query(
        collection(firestore, 'connections'),
        where('participants', 'array-contains', currentUser.uid)
      );
      const connectionsSnapshot = await getDocs(existingConnectionQuery);

      let hasConnection = false;
      connectionsSnapshot.forEach((doc) => {
        const connectionData = doc.data();
        if (connectionData.participants.includes(user.id) && connectionData.status === 'active') {
          hasConnection = true;
        }
      });

      // Check for existing requests
      const existingRequestQuery = query(
        collection(firestore, 'connectionRequests'),
        where('fromUserId', '==', currentUser.uid),
        where('toUserId', '==', user.id),
        where('status', '==', 'pending')
      );
      const requestSnapshot = await getDocs(existingRequestQuery);

      let hasRequest = false;
      if (!requestSnapshot.empty) {
        hasRequest = true;
      }

      // Don't create connection request or notification here
      // They will be created when the user sends their first message

      // Navigate to chat screen with this user
      navigation.navigate('Chat', { 
        userId: user.id,
        userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Anonymous User',
        userPhotoURL: user.photoURL
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat');
    }
  };

  

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays}d ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours}h ago`;
    } else {
      return 'Just now';
    }
  };

  const renderUserItem = ({ item }: { item: NearbyUser }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: currentTheme.surface }]}
      onPress={() => handleMessageUser(item)}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.photoURL ? (
            <AvatarImage 
              source={{ 
                uri: item.photoURL,
                cache: 'reload'
              }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: currentTheme.border }]}>
              <Ionicons name="person" size={24} color={currentTheme.textSecondary} />
            </View>
          )}
          {item.isOnline === true && <View style={[styles.onlineIndicator, { borderColor: currentTheme.surface }]} />}
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: currentTheme.text }]}>
            {item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : 'Anonymous User'}
          </Text>
          {item.bio ? (
            <Text style={[styles.userBio, { color: currentTheme.textSecondary }]} numberOfLines={2}>
              {item.bio}
            </Text>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
    </TouchableOpacity>
  );



  

  const renderEmptyState = () => {
    const config = {
      icon: 'people-outline',
      title: 'No People Found',
      subtitle: 'There are no people to show right now.'
    };

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={config.icon as any}
          size={64}
          color={currentTheme.textSecondary}
        />
        <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
          {config.title}
        </Text>
        <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
          {config.subtitle}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>People</Text>
        <NotificationBell 
          onPress={() => navigation.navigate('Notifications')} 
          color={currentTheme.text}
        />
      </View>

      

      {loading ? (
        <NearbySkeleton count={5} />
      ) : (
        <FlatList
          data={nearbyUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            nearbyUsers.length === 0
              ? styles.emptyContainer
              : styles.listContent
          }
        />
      )}
    </SafeAreaView>
  );
}

const lightTheme = {
  background: COLORS.background,
  surface: COLORS.surface,
  text: COLORS.text,
  textSecondary: COLORS.textSecondary,
  border: COLORS.border,
};

const darkTheme = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
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
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  userBio: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 16,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
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