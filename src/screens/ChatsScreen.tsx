
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
import { collection, getDocs, doc, getDoc, query, orderBy, where, limit, deleteDoc, addDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';

interface ChatItem {
  id: string;
  participantId: string;
  participantName: string;
  participantPhotoURL: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
}

interface ConnectionItem {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  connectedAt: Date;
  isOnline?: boolean;
}

interface RequestItem {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhotoURL: string;
  toUserId: string;
  message: string;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function ChatsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'chats' | 'connections' | 'requests'>('chats');
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
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
        await loadChatItems();
      } else if (activeTab === 'connections') {
        await loadConnections();
      } else if (activeTab === 'requests') {
        await loadRequests();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadChatItems = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();

      // Get all connections for current user
      const connectionsQuery = query(
        collection(firestore, 'connections'),
        where('participants', 'array-contains', currentUser.uid)
      );

      const connectionsSnapshot = await getDocs(connectionsQuery);
      const chatsList: ChatItem[] = [];

      for (const connectionDoc of connectionsSnapshot.docs) {
        const connectionData = connectionDoc.data();

        // Get the other participant's ID
        const otherUserId = connectionData.participants.find((id: string) => id !== currentUser.uid);

        if (otherUserId) {
          // Get user data for the connected person
          const userDoc = await getDoc(doc(firestore, 'users', otherUserId));
          const userData = userDoc.exists() ? userDoc.data() : {};

          // Get chat room for these two users
          const chatRoomId = [currentUser.uid, otherUserId].sort().join('_');

          // Get the last message from this chat
          const chatDoc = await getDoc(doc(firestore, 'chats', chatRoomId));
          let lastMessage = '';
          let lastMessageTime = connectionData.connectedAt?.toDate() || new Date();

          if (chatDoc.exists()) {
            const chatData = chatDoc.data();
            lastMessage = chatData.lastMessage || 'No messages yet';
            lastMessageTime = chatData.lastMessageTime?.toDate() || lastMessageTime;
          } else {
            lastMessage = 'No messages yet';
          }

          chatsList.push({
            id: connectionDoc.id,
            participantId: otherUserId,
            participantName: userData.firstName && userData.lastName 
              ? `${userData.firstName} ${userData.lastName}` 
              : 'Anonymous User',
            participantPhotoURL: userData.photoURL || '',
            lastMessage: lastMessage,
            lastMessageTime: lastMessageTime,
            unreadCount: 0, // We can implement this later
            isOnline: Math.random() > 0.5, // Mock online status for now
          });
        }
      }

      // Sort by last message time (most recent first)
      chatsList.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

      setChatItems(chatsList);
    } catch (error) {
      console.error('Error loading chat items:', error);
    }
  };

  const loadConnections = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();

      const connectionsQuery = query(
        collection(firestore, 'connections'),
        where('participants', 'array-contains', currentUser.uid),
        orderBy('connectedAt', 'desc')
      );

      const connectionsSnapshot = await getDocs(connectionsQuery);
      const connectionsList: ConnectionItem[] = [];

      for (const connectionDoc of connectionsSnapshot.docs) {
        const connectionData = connectionDoc.data();
        const otherUserId = connectionData.participants.find((id: string) => id !== currentUser.uid);

        if (otherUserId) {
          const userDoc = await getDoc(doc(firestore, 'users', otherUserId));
          const userData = userDoc.exists() ? userDoc.data() : {};

          connectionsList.push({
            id: connectionDoc.id,
            userId: otherUserId,
            userName: userData.firstName && userData.lastName 
              ? `${userData.firstName} ${userData.lastName}` 
              : 'Anonymous User',
            userPhotoURL: userData.photoURL || '',
            connectedAt: connectionData.connectedAt?.toDate() || new Date(),
            isOnline: Math.random() > 0.5, // Mock online status
          });
        }
      }

      setConnections(connectionsList);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const loadRequests = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();

      // Get incoming requests
      const incomingRequestsQuery = query(
        collection(firestore, 'connectionRequests'),
        where('toUserId', '==', currentUser.uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const incomingRequestsSnapshot = await getDocs(incomingRequestsQuery);
      const requestsList: RequestItem[] = [];

      for (const requestDoc of incomingRequestsSnapshot.docs) {
        const requestData = requestDoc.data();
        
        // Get sender's data
        const senderDoc = await getDoc(doc(firestore, 'users', requestData.fromUserId));
        const senderData = senderDoc.exists() ? senderDoc.data() : {};

        requestsList.push({
          id: requestDoc.id,
          fromUserId: requestData.fromUserId,
          fromUserName: senderData.firstName && senderData.lastName 
            ? `${senderData.firstName} ${senderData.lastName}` 
            : 'Anonymous User',
          fromUserPhotoURL: senderData.photoURL || '',
          toUserId: requestData.toUserId,
          message: requestData.message || '',
          createdAt: requestData.createdAt?.toDate() || new Date(),
          status: requestData.status,
        });
      }

      setRequests(requestsList);
    } catch (error) {
      console.error('Error loading requests:', error);
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
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays}d`;
    } else if (diffInHours > 0) {
      return `${diffInHours}h`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes}m`;
    } else {
      return 'now';
    }
  };

  const handleChatPress = (chatItem: ChatItem) => {
    navigation.navigate('Chat', {
      userId: chatItem.participantId,
      userName: chatItem.participantName,
      userPhotoURL: chatItem.participantPhotoURL
    });
  };

  const handleViewUserDetails = (item: ConnectionItem | RequestItem) => {
    const userId = 'userId' in item ? item.userId : item.fromUserId;
    const userName = 'userName' in item ? item.userName : item.fromUserName;
    const userPhotoURL = 'userPhotoURL' in item ? item.userPhotoURL : item.fromUserPhotoURL;
    
    navigation.navigate('UserProfile', {
      userId: userId,
      firstName: userName.split(' ')[0] || '',
      lastName: userName.split(' ').slice(1).join(' ') || '',
      photoURL: userPhotoURL,
      bio: ''
    });
  };

  const handleMessageUser = (connection: ConnectionItem) => {
    navigation.navigate('Chat', {
      userId: connection.userId,
      userName: connection.userName,
      userPhotoURL: connection.userPhotoURL
    });
  };

  const handleAcceptRequest = async (request: RequestItem) => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();

      // Create connection
      await addDoc(collection(firestore, 'connections'), {
        participants: [currentUser.uid, request.fromUserId],
        connectedAt: new Date(),
        createdBy: request.fromUserId,
      });

      // Update request status (or delete it)
      await deleteDoc(doc(firestore, 'connectionRequests', request.id));

      // Refresh the data
      await loadData();

      Alert.alert('Success', 'Connection request accepted!');
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (request: RequestItem) => {
    try {
      await deleteDoc(doc(getFirestore(), 'connectionRequests', request.id));
      await loadData();
      Alert.alert('Success', 'Connection request rejected');
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  const handleRemoveConnection = async (connection: ConnectionItem) => {
    Alert.alert(
      'Remove Connection',
      `Are you sure you want to remove ${connection.userName} from your connections?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { getAuth } = await import('../services/firebase');
              const auth = getAuth();
              const currentUser = auth.currentUser;

              if (currentUser) {
                const chatRoomId = [currentUser.uid, connection.userId].sort().join('_');
                const chatRef = doc(getFirestore(), 'chats', chatRoomId);

                try {
                  await deleteDoc(chatRef);
                } catch (error) {
                  console.log('Chat document does not exist or already deleted');
                }

                await deleteDoc(doc(getFirestore(), 'connections', connection.id));
                await loadData();
                Alert.alert('Success', 'Connection removed');
              }
            } catch (error) {
              console.error('Error removing connection:', error);
              Alert.alert('Error', 'Failed to remove connection');
            }
          },
        },
      ]
    );
  };

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      style={[styles.chatItem, { backgroundColor: currentTheme.surface }]}
      onPress={() => handleChatPress(item)}
    >
      <View style={styles.avatarContainer}>
        {item.participantPhotoURL ? (
          <Image source={{ uri: item.participantPhotoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: currentTheme.border }]}>
            <Ionicons name="person" size={24} color={currentTheme.textSecondary} />
          </View>
        )}
        {item.isOnline && <View style={[styles.onlineIndicator, { borderColor: currentTheme.surface }]} />}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.participantName, { color: currentTheme.text }]} numberOfLines={1}>
            {item.participantName}
          </Text>
          <Text style={[styles.timeText, { color: currentTheme.textSecondary }]}>
            {formatTimeAgo(item.lastMessageTime)}
          </Text>
        </View>

        <View style={styles.messageRow}>
          <Text 
            style={[styles.lastMessage, { color: currentTheme.textSecondary }]} 
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => handleViewUserDetails({ userId: item.participantId, userName: item.participantName, userPhotoURL: item.participantPhotoURL } as ConnectionItem)}
      >
        <Ionicons name="person-outline" size={20} color={currentTheme.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderConnectionItem = ({ item }: { item: ConnectionItem }) => (
    <View style={[styles.connectionItem, { backgroundColor: currentTheme.surface }]}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.userPhotoURL ? (
            <Image source={{ uri: item.userPhotoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: currentTheme.border }]}>
              <Ionicons name="person" size={24} color={currentTheme.textSecondary} />
            </View>
          )}
          {item.isOnline && <View style={[styles.onlineIndicator, { borderColor: currentTheme.surface }]} />}
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: currentTheme.text }]}>
            {item.userName}
          </Text>
          <Text style={[styles.userEmail, { color: currentTheme.textSecondary }]}>
            Connected {formatTimeAgo(item.connectedAt)}
          </Text>
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
          style={styles.messageIconButton}
          onPress={() => handleMessageUser(item)}
        >
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.blockIconButton}
          onPress={() => handleRemoveConnection(item)}
        >
          <Ionicons name="close-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRequestItem = ({ item }: { item: RequestItem }) => (
    <View style={[styles.requestItem, { backgroundColor: currentTheme.surface }]}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.fromUserPhotoURL ? (
            <Image source={{ uri: item.fromUserPhotoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: currentTheme.border }]}>
              <Ionicons name="person" size={24} color={currentTheme.textSecondary} />
            </View>
          )}
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: currentTheme.text }]}>
            {item.fromUserName}
          </Text>
          {item.message ? (
            <Text style={[styles.requestMessage, { color: currentTheme.textSecondary }]} numberOfLines={2}>
              {item.message}
            </Text>
          ) : null}
          <Text style={[styles.requestTime, { color: currentTheme.textSecondary }]}>
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => handleViewUserDetails(item)}
        >
          <Ionicons name="person-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item)}
        >
          <Ionicons name="checkmark" size={16} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRejectRequest(item)}
        >
          <Ionicons name="close" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    const getEmptyStateConfig = () => {
      switch (activeTab) {
        case 'chats':
          return {
            icon: 'chatbubbles-outline',
            title: 'No Conversations',
            subtitle: 'Connect with people nearby to start chatting with them.'
          };
        case 'connections':
          return {
            icon: 'people-outline',
            title: 'No Connections',
            subtitle: 'Accept connection requests to build your network.'
          };
        case 'requests':
          return {
            icon: 'mail-outline',
            title: 'No Requests',
            subtitle: 'Connection requests will appear here.'
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

  const getCurrentData = () => {
    switch (activeTab) {
      case 'chats':
        return chatItems;
      case 'connections':
        return connections;
      case 'requests':
        return requests;
      default:
        return [];
    }
  };

  const getCurrentRenderItem = () => {
    switch (activeTab) {
      case 'chats':
        return renderChatItem;
      case 'connections':
        return renderConnectionItem;
      case 'requests':
        return renderRequestItem;
      default:
        return renderChatItem;
    }
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
          {requests.length > 0 && (
            <View style={styles.requestBadge}>
              <Text style={styles.requestBadgeText}>{requests.length}</Text>
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
          data={getCurrentData()}
          keyExtractor={(item) => item.id}
          renderItem={getCurrentRenderItem()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={getCurrentData().length === 0 ? styles.emptyContainer : styles.listContent}
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
    position: 'relative',
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
  requestBadge: {
    position: 'absolute',
    top: 2,
    right: 8,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
  },
  chatContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    flex: 1,
    marginRight: SPACING.sm,
  },
  timeText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    flex: 1,
    marginRight: SPACING.sm,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: 'white',
  },
  moreButton: {
    padding: SPACING.sm,
  },
  connectionItem: {
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
  connectionActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  detailsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  messageIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  blockIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
  },
  requestMessage: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  requestTime: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  requestActions: {
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
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
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
