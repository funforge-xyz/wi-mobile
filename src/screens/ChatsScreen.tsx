
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
  const [activeTab, setActiveTab] = useState<'chats' | 'requests' | 'connections'>('chats');
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
      // Mock data for now - replace with actual Firebase implementation
      const mockRequests: ConnectionRequest[] = [
        {
          id: '1',
          userId: 'user3',
          firstName: 'Carol',
          lastName: 'Davis',
          email: 'carol@example.com',
          photoURL: '',
          bio: 'Love hiking and photography',
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: '2',
          userId: 'user4',
          firstName: 'David',
          lastName: 'Wilson',
          email: 'david@example.com',
          photoURL: '',
          bio: 'Software developer',
          status: 'pending',
          createdAt: new Date(Date.now() - 86400000),
        },
      ];
      setConnectionRequests(mockRequests);
    } catch (error) {
      console.error('Error loading connection requests:', error);
    }
  };

  const loadConnections = async () => {
    try {
      // Mock data for now - replace with actual Firebase implementation
      const mockConnections: Connection[] = [
        {
          id: '1',
          userId: 'user5',
          firstName: 'Emma',
          lastName: 'Wilson',
          email: 'emma@example.com',
          photoURL: '',
          bio: 'Digital artist and designer',
          connectedAt: new Date(Date.now() - 86400000),
          isOnline: true,
        },
        {
          id: '2',
          userId: 'user6',
          firstName: 'Michael',
          lastName: 'Brown',
          email: 'michael@example.com',
          photoURL: '',
          bio: 'Coffee enthusiast and writer',
          connectedAt: new Date(Date.now() - 172800000),
          isOnline: false,
        },
      ];
      setConnections(mockConnections);
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

  const handleAcceptRequest = (request: ConnectionRequest) => {
    Alert.alert('Accept', `Accept connection request from ${request.firstName}?`);
  };

  const handleRejectRequest = (request: ConnectionRequest) => {
    Alert.alert('Reject', `Reject connection request from ${request.firstName}?`);
  };

  const handleStartChat = (connection: Connection) => {
    Alert.alert('Start Chat', `Start conversation with ${connection.firstName}?`);
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
          <Text style={[styles.userEmail, { color: currentTheme.textSecondary }]}>{item.email}</Text>
          {item.bio ? (
            <Text style={[styles.userBio, { color: currentTheme.textSecondary }]} numberOfLines={2}>
              {item.bio}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.connectionActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item)}
        >
          <Ionicons name="checkmark" size={18} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRejectRequest(item)}
        >
          <Ionicons name="close" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderConnectionItem = ({ item }: { item: Connection }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: currentTheme.surface }]}
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
          {item.isOnline && <View style={[styles.onlineIndicator, { borderColor: currentTheme.surface }]} />}
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: currentTheme.text }]}>
            {item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : 'Anonymous User'}
          </Text>
          <Text style={[styles.userEmail, { color: currentTheme.textSecondary }]}>{item.email}</Text>
          {item.bio ? (
            <Text style={[styles.userBio, { color: currentTheme.textSecondary }]} numberOfLines={2}>
              {item.bio}
            </Text>
          ) : null}
        </View>
      </View>
      <TouchableOpacity
        style={styles.chatIconButton}
        onPress={() => handleStartChat(item)}
      >
        <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
      </TouchableOpacity>
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
        case 'requests':
          return {
            icon: 'person-add-outline',
            title: 'No Requests',
            subtitle: 'You have no pending connection requests.'
          };
        case 'connections':
          return {
            icon: 'people-outline',
            title: 'No Connections',
            subtitle: 'Connect with people to start chatting.'
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
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={
            activeTab === 'chats' ? chatMessages :
            activeTab === 'requests' ? connectionRequests :
            connections
          }
          keyExtractor={(item) => item.id}
          renderItem={
            activeTab === 'chats' ? renderChatItem :
            activeTab === 'requests' ? renderRequestItem :
            renderConnectionItem
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            (activeTab === 'chats' ? chatMessages : 
             activeTab === 'requests' ? connectionRequests :
             connections).length === 0
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
  chatIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
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
