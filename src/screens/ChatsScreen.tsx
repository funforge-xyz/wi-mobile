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
import { collection, getDocs, doc, getDoc, query, orderBy, where, limit } from 'firebase/firestore';
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

export default function ChatsScreen({ navigation }: any) {
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    loadChatItems();
  }, []);

  const loadChatItems = async () => {
    try {
      setLoading(true);
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
      Alert.alert('Error', 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChatItems();
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

  const handleUserPress = (chatItem: ChatItem) => {
    navigation.navigate('UserProfile', {
      userId: chatItem.participantId,
      firstName: chatItem.participantName.split(' ')[0] || '',
      lastName: chatItem.participantName.split(' ').slice(1).join(' ') || '',
      photoURL: chatItem.participantPhotoURL,
      bio: ''
    });
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
        onPress={() => handleUserPress(item)}
      >
        <Ionicons name="person-outline" size={20} color={currentTheme.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="chatbubbles-outline"
        size={64}
        color={currentTheme.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
        No Conversations
      </Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
        Connect with people nearby to start chatting with them.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Chats</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={chatItems}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={chatItems.length === 0 ? styles.emptyContainer : styles.listContent}
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