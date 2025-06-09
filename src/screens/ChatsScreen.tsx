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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import { collection, getDocs, doc, getDoc, query, orderBy, where, addDoc, updateDoc, deleteDoc, limit, onSnapshot } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';

interface ChatMessage {
  id: string;
  participantId: string;
  participantName: string;
  participantPhotoURL: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

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
}

interface NotificationBellProps {
  onPress: () => void;
  color: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onPress, color }) => {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 8 }}>
      <Ionicons name="notifications-outline" size={24} color={color} />
    </TouchableOpacity>
  );
};

export default function ChatsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'connections' | 'requests'>('connections');
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  // Force refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (activeTab === 'connections') {
        // Force a small delay to ensure any recent message updates are reflected
        setTimeout(() => {
          setConnections(prevConnections => [...prevConnections]);
        }, 100);
      }
    }, [activeTab])
  );

  useEffect(() => {
    let unsubscribeRequests: (() => void) | null = null;
    let unsubscribeConnections: (() => void) | null = null;

    const setupRealtimeListeners = async () => {
      try {
        const { getAuth } = await import('../services/firebase');
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) return;

        const firestore = getFirestore();

        // Real-time listener for connection requests (only pending ones)
        const requestsQuery = query(
          collection(firestore, 'connectionRequests'),
          where('toUserId', '==', currentUser.uid),
          where('status', '==', 'pending')
        );

        unsubscribeRequests = onSnapshot(requestsQuery, async (snapshot) => {
          const requests: ConnectionRequest[] = [];

          for (const requestDoc of snapshot.docs) {
            const requestData = requestDoc.data();

            // Get sender information
            const senderDoc = await getDoc(doc(firestore, 'users', requestData.fromUserId));
            const senderData = senderDoc.exists() ? senderDoc.data() : {};

            requests.push({
              id: requestDoc.id,
              userId: requestData.fromUserId,
              firstName: senderData.firstName || '',
              lastName: senderData.lastName || '',
              email: senderData.email || '',
              photoURL: senderData.photoURL || '',
              bio: senderData.bio || '',
              status: requestData.status,
              createdAt: requestData.createdAt?.toDate() || new Date(),
            });
          }

          requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          setConnectionRequests(requests);
        });

        // Real-time listener for connections
        const connectionsQuery = query(
          collection(firestore, 'connections'),
          where('participants', 'array-contains', currentUser.uid),
          where('status', '==', 'active')
        );

        unsubscribeConnections = onSnapshot(connectionsQuery, async (snapshot) => {
          const connections: Connection[] = [];

          for (const connectionDoc of snapshot.docs) {
            const connectionData = connectionDoc.data();
            const otherParticipantId = connectionData.participants.find((id: string) => id !== currentUser.uid);

            if (otherParticipantId) {
              // Get other participant information
              const userDoc = await getDoc(doc(firestore, 'users', otherParticipantId));
              const userData = userDoc.exists() ? userDoc.data() : {};

              // Get last message from chat - try chat document first, then messages collection
              let lastMessage = '';
              let lastMessageTime: Date | undefined;

              if (connectionData.chatId) {
                try {
                  // First try to get last message from chat document
                  const chatDoc = await getDoc(doc(firestore, 'chats', connectionData.chatId));
                  if (chatDoc.exists()) {
                    const chatData = chatDoc.data();
                    if (chatData.lastMessage) {
                      lastMessage = chatData.lastMessage;
                      lastMessageTime = chatData.lastMessageTime?.toDate();
                    }
                  }

                  // If no last message in chat document, query messages collection
                  if (!lastMessage) {
                    const messagesQuery = query(
                      collection(firestore, 'chats', connectionData.chatId, 'messages'),
                      orderBy('createdAt', 'desc'),
                      limit(1)
                    );
                    const messagesSnapshot = await getDocs(messagesQuery);

                    if (!messagesSnapshot.empty) {
                      const lastMessageData = messagesSnapshot.docs[0].data();
                      lastMessage = lastMessageData.text || '';
                      lastMessageTime = lastMessageData.createdAt?.toDate();
                    }
                  }
                } catch (error) {
                  console.log('Error fetching last message:', error);
                }
              }

              connections.push({
                id: connectionDoc.id,
                userId: otherParticipantId,
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                photoURL: userData.thumbnailURL || userData.photoURL || '',
                bio: userData.bio || '',
                connectedAt: connectionData.connectedAt?.toDate() || new Date(),
                lastMessage,
                lastMessageTime,
                isOnline: Math.random() > 0.5, // Mock online status
              });
            }
          }

          // Sort by last message time, then by connection time
          connections.sort((a, b) => {
            if (a.lastMessageTime && b.lastMessageTime) {
              return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
            } else if (a.lastMessageTime) {
              return -1;
            } else if (b.lastMessageTime) {
              return 1;
            } else {
              return b.connectedAt.getTime() - a.connectedAt.getTime();
            }
          });

          setConnections(connections);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up real-time listeners:', error);
        setLoading(false);
      }
    };

    setupRealtimeListeners();

    // Cleanup listeners on unmount
    return () => {
      if (unsubscribeRequests) unsubscribeRequests();
      if (unsubscribeConnections) unsubscribeConnections();
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Real-time listeners will automatically update data
    setTimeout(() => setRefreshing(false), 1000);
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

  const handleUserPress = (user: ConnectionRequest | Connection) => {
    navigation.navigate('Profile', { userId: user.userId });
  };

  const handleReplyToRequest = async (request: ConnectionRequest) => {
    navigation.navigate('Chat', {
      userId: request.userId,
      userName: request.firstName && request.lastName ? `${request.firstName} ${request.lastName}` : 'Anonymous User',
      userPhotoURL: request.photoURL
    });
  };

  const handleDeclineRequest = async (request: ConnectionRequest) => {
    Alert.alert(
      'Decline Request',
      `Are you sure you want to decline the request from ${request.firstName || 'this user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              const firestore = getFirestore();
              await deleteDoc(doc(firestore, 'connectionRequests', request.id));
            } catch (error) {
              console.error('Error declining request:', error);
              Alert.alert('Error', 'Failed to decline request');
            }
          }
        }
      ]
    );
  };

  const handleStartChat = (connection: Connection) => {
    navigation.navigate('Chat', {
      userId: connection.userId,
      userName: connection.firstName && connection.lastName ? `${connection.firstName} ${connection.lastName}` : 'Anonymous User',
      userPhotoURL: connection.photoURL
    });
  };

  const handleBlockUser = async (connection: Connection) => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${connection.firstName || 'this user'}? They will be removed from your connections.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const { getAuth } = await import('../services/firebase');
              const auth = getAuth();
              const currentUser = auth.currentUser;

              if (!currentUser) return;

              const firestore = getFirestore();

              // Add to blocked users
              await addDoc(collection(firestore, 'blockedUsers'), {
                blockerUserId: currentUser.uid,
                blockedUserId: connection.userId,
                blockedAt: new Date()
              });

              // Update connection status
              await updateDoc(doc(firestore, 'connections', connection.id), {
                status: 'blocked',
                blockedAt: new Date(),
                blockedBy: currentUser.uid
              });

              Alert.alert('Success', 'User has been blocked');
            } catch (error) {
              console.error('Error blocking user:', error);
              Alert.alert('Error', 'Failed to block user');
            }
          }
        }
      ]
    );
  };

  const renderRequestItem = ({ item }: { item: ConnectionRequest }) => (
    <View
      style={[styles.userItem, { backgroundColor: currentTheme.surface }]}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: currentTheme.border }]}>
              <Ionicons name="person" size={24} color={currentTheme.textSecondary} />
            </View>
          )}
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
          <Text style={[styles.timeText, { color: currentTheme.textSecondary }]}>
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
      </View>
      <View style={styles.connectionActions}>
        <TouchableOpacity
          style={styles.messageIconButton}
          onPress={() => handleReplyToRequest(item)}
        >
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleDeclineRequest(item)}
        >
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConnectionItem = ({ item }: { item: Connection }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: currentTheme.surface }]}
      onPress={() => handleStartChat(item)}
    >
      <View style={styles.chatAvatar}>
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: currentTheme.border }]}>
            <Ionicons name="person" size={24} color={currentTheme.textSecondary} />
          </View>
        )}
        {item.isOnline && <View style={[styles.onlineIndicator, { borderColor: currentTheme.surface }]} />}
      </View>

      <View style={styles.chatContent}>
        <View>
          <Text style={[styles.participantName, { color: currentTheme.text }]}>
            {item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : 'Anonymous User'}
          </Text>
        </View>

        {item.lastMessage && (
          <View style={styles.messageRow}>
            <Text style={[styles.lastMessage, { color: currentTheme.textSecondary }]} numberOfLines={1}>
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

      <TouchableOpacity
        style={styles.blockIconButton}
        onPress={() => handleBlockUser(item)}
      >
        <Ionicons name="ban-outline" size={20} color={COLORS.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    const getEmptyStateConfig = () => {
      switch (activeTab) {
        case 'requests':
          return {
            icon: 'mail-outline',
            title: 'No Requests',
            subtitle: 'No connection requests at the moment.'
          };
        case 'connections':
          return {
            icon: 'people-outline',
            title: 'No Connections',
            subtitle: 'Start messaging people from Nearby to build connections.'
          };
        default:
          return {
            icon: 'chatbubbles-outline',
            title: 'No Data',
            subtitle: 'Nothing to show right now.'
          };
      }
    };

    const config = getEmptyStateConfig();

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
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Messages</Text>
        <NotificationBell 
          onPress={() => navigation.navigate('Notifications')} 
          color={currentTheme.text}
        />
      </View>

      <View style={[styles.tabContainer, { backgroundColor: currentTheme.surface }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'connections' && styles.activeTab]}
          onPress={() => setActiveTab('connections')}
        >
          <Text style={[
            styles.tabText,
            { color: currentTheme.textSecondary },
            activeTab === 'connections' && styles.activeTabText
          ]}>
            Connections
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[
            styles.tabText,
            { color: currentTheme.textSecondary },
            activeTab === 'requests' && styles.activeTabText
          ]}>
            Requests
          </Text>
          {connectionRequests.length > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{connectionRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'requests' ? connectionRequests : connections}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 'requests' ? renderRequestItem : renderConnectionItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            (activeTab === 'requests' ? connectionRequests : connections).length === 0
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.primary + '20',
  },
  tabText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
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
  connectionActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  blockIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
    marginLeft: SPACING.md
  },
  chatItemContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    marginVertical: SPACING.xs / 2,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  chatAvatar: {
    marginRight: SPACING.md,
  },
  chatContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
    gap: SPACING.xs / 2,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    marginTop: SPACING.xs / 2,
  },
  participantName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    flex: 1,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 18,
    marginRight: SPACING.sm,
    flexShrink: 1
  },
  timeText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    flexShrink: 0,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  unreadText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: 'white',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyButton: {
    backgroundColor: COLORS.primary,
  },
  declineButton: {
    backgroundColor: COLORS.error,
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
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  messageIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
});