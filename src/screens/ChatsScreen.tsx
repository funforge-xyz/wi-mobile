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
import { collection, getDocs, doc, getDoc, query, orderBy, where, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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
  isOnline?: boolean;
}

export default function ChatsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'chats' | 'connections' | 'requests'>('chats');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'chats') {
        await loadChatMessages();
      } else if (activeTab === 'requests') {
        await loadConnectionRequests();
      } else if (activeTab === 'connections') {
        await loadConnections();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async () => {
    try {
      // Mock data for now - replace with actual Firebase implementation
      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          participantId: 'user1',
          participantName: 'Alice Johnson',
          participantPhotoURL: '',
          lastMessage: 'Hey! How are you?',
          lastMessageTime: new Date(),
          unreadCount: 2,
        },
        {
          id: '2',
          participantId: 'user2',
          participantName: 'Bob Smith',
          participantPhotoURL: '',
          lastMessage: 'Thanks for connecting!',
          lastMessageTime: new Date(Date.now() - 3600000),
          unreadCount: 0,
        },
      ];
      setChatMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadConnectionRequests = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();

      // Get pending requests for current user (simplified query)
      const requestsQuery = query(
        collection(firestore, 'connectionRequests'),
        where('toUserId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );

      const requestsSnapshot = await getDocs(requestsQuery);
      const requests: ConnectionRequest[] = [];

      for (const requestDoc of requestsSnapshot.docs) {
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

      // Sort by creation date in memory
      requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setConnectionRequests(requests);
    } catch (error) {
      console.error('Error loading connection requests:', error);
    }
  };

  const loadConnections = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();

      // Get connections for current user (simplified query)
      const connectionsQuery = query(
        collection(firestore, 'connections'),
        where('participants', 'array-contains', currentUser.uid)
      );

      const connectionsSnapshot = await getDocs(connectionsQuery);
      const connections: Connection[] = [];

      for (const connectionDoc of connectionsSnapshot.docs) {
        const connectionData = connectionDoc.data();

        // Get the other participant's ID
        const otherUserId = connectionData.participants.find((id: string) => id !== currentUser.uid);

        if (otherUserId) {
          // Get user data for the connected person
          const userDoc = await getDoc(doc(firestore, 'users', otherUserId));
          const userData = userDoc.exists() ? userDoc.data() : {};

          connections.push({
            id: connectionDoc.id,
            userId: otherUserId,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            photoURL: userData.photoURL || '',
            bio: userData.bio || '',
            connectedAt: connectionData.connectedAt?.toDate() || new Date(),
            isOnline: Math.random() > 0.5, // Mock online status for now
          });
        }
      }

      // Sort by connection date in memory
      connections.sort((a, b) => b.connectedAt.getTime() - a.connectedAt.getTime());

      setConnections(connections);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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

  const handleChatPress = (chat: ChatMessage) => {
    Alert.alert('Open Chat', `Open conversation with ${chat.participantName}`);
  };

  const handleUserPress = (user: ConnectionRequest | Connection) => {
    // Navigate to user profile
    navigation.navigate('Profile', { userId: user.userId });
  };

  const handleReplyToRequest = async (request: ConnectionRequest) => {
    // Navigate to chat screen to reply
    navigation.navigate('Chat', {
      userId: request.userId,
      userName: request.firstName && request.lastName ? `${request.firstName} ${request.lastName}` : 'Anonymous User',
      userPhotoURL: request.photoURL
    });
  };

  const handleDeclineRequest = async (request: ConnectionRequest) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this message request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              const firestore = getFirestore();

              // Delete the request and any related chat
              await deleteDoc(doc(firestore, 'connectionRequests', request.id));

              // Delete the chat room if it exists
              const { getAuth } = await import('../services/firebase');
              const auth = getAuth();
              const currentUser = auth.currentUser;

              if (currentUser) {
                const chatRoomId = [currentUser.uid, request.userId].sort().join('_');
                const chatRef = doc(firestore, 'chats', chatRoomId);

                try {
                  await deleteDoc(chatRef);
                } catch (error) {
                  // Chat room might not exist, ignore error
                }
              }

              // Reload data
              await loadData();
            } catch (error) {
              console.error('Error declining request:', error);
              Alert.alert('Error', 'Failed to decline request');
            }
          }
        }
      ]
    );
  };

  const handleViewUserDetails = (connection: Connection) => {
    navigation.navigate('UserProfile', {
      userId: connection.userId,
      firstName: connection.firstName,
      lastName: connection.lastName,
      photoURL: connection.photoURL,
      bio: connection.bio
    });
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
      `Are you sure you want to block ${connection.firstName || 'this user'}? They will be removed from your connections and you won't see them in nearby feeds.`,
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
                createdAt: new Date(),
              });

              // Remove from connections
              const connectionsQuery = query(
                collection(firestore, 'connections'),
                where('participants', 'array-contains', currentUser.uid)
              );
              const connectionsSnapshot = await getDocs(connectionsQuery);

              for (const connectionDoc of connectionsSnapshot.docs) {
                const data = connectionDoc.data();
                if (data.participants.includes(connection.userId)) {
                  await connectionDoc.ref.delete();
                }
              }

              // Reload data
              await loadData();
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

  const renderChatItem = ({ item }: { item: ChatMessage }) => (
    <TouchableOpacity
      style={[styles.messageItem, { backgroundColor: currentTheme.surface }]}
      onPress={() => handleChatPress(item)}
    >
      <View style={styles.messageInfo}>
        <View style={styles.avatarContainer}>
          {item.participantPhotoURL ? (
            <Image source={{ uri: item.participantPhotoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: currentTheme.border }]}>
              <Ionicons name="person" size={24} color={currentTheme.textSecondary} />
            </View>
          )}
        </View>
        <View style={styles.messageDetails}>
          <Text style={[styles.participantName, { color: currentTheme.text }]}>
            {item.participantName}
          </Text>
          <Text style={[styles.lastMessage, { color: currentTheme.textSecondary }]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
      </View>
      <View style={styles.messageTime}>
        <Text style={[styles.timeText, { color: currentTheme.textSecondary }]}>
          {formatTimeAgo(item.lastMessageTime)}
        </Text>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderRequestItem = ({ item }: { item: ConnectionRequest }) => (
    <TouchableOpacity
      style={[styles.connectionItem, { backgroundColor: currentTheme.surface }]}
      onPress={() => handleUserPress(item)}
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
        </View>
      </View>
      <View style={styles.connectionActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.replyButton]}
          onPress={() => handleReplyToRequest(item)}
        >
          <Ionicons name="chatbubble" size={18} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => handleDeclineRequest(item)}
        >
          <Ionicons name="close" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderConnectionItem = ({ item }: { item: Connection }) => (
    <TouchableOpacity
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
          {item.isOnline && <View style={[styles.onlineIndicator, { borderColor: currentTheme.surface }]} />}
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
      <View style={styles.connectionActions}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => handleViewUserDetails(item)}
        >
          <Ionicons name="person-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.blockIconButton}
          onPress={() => handleBlockUser(item)}
        >
          <Ionicons name="ban-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    const getEmptyStateConfig = () => {
      switch (activeTab) {
        case 'chats':
          return {
            icon: 'chatbubble-outline',
            title: 'No Chats',
            subtitle: 'Start a conversation with someone nearby.'
          };
        case 'connections':
          return {
            icon: 'people-outline',
            title: 'No Connections',
            subtitle: 'Connect with people to start chatting.'
          };
        case 'requests':
          return {
            icon: 'person-add-outline',
            title: 'No Requests',
            subtitle: 'You have no pending connection requests.'
          };
        default:
          return {
            icon: 'chatbubble-outline',
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
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Chats</Text>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: currentTheme.surface }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
          onPress={() => setActiveTab('chats')}
        >
          <Text style={[
            styles.tabText, 
            { color: currentTheme.textSecondary }, 
            activeTab === 'chats' && styles.activeTabText
          ]}>
            Chats
          </Text>
        </TouchableOpacity>
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
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={
            activeTab === 'chats' ? chatMessages :
            activeTab === 'connections' ? connections :
            connectionRequests
          }
          keyExtractor={(item) => item.id}
          renderItem={
            activeTab === 'chats' ? renderChatItem :
            activeTab === 'connections' ? renderConnectionItem :
            renderRequestItem
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            (activeTab === 'chats' ? chatMessages : 
             activeTab === 'connections' ? connections :
             connectionRequests).length === 0
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
  connectionActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  detailsButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginRight: SPACING.sm,
  },
  detailsButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  chatIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  blockIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  messageTime: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  unreadText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: 'white',
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
  },
  connectionActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
});