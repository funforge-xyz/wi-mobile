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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { Thread, Message } from '../types/models';
import { Settings } from '../services/storage';
import { useAppSelector } from '../hooks/redux';

interface ChatItem extends Thread {
  otherUserName: string;
  otherUserAvatar?: string;
  unreadCount: number;
  isOnline: boolean;
}

export default function ChatsScreen() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const settings = new Settings();

  // Mock data
  const mockChats: ChatItem[] = [
    {
      id: '1',
      participants: ['user1', 'user2'],
      otherUserName: 'Alice Johnson',
      otherUserAvatar: 'https://via.placeholder.com/50',
      unreadCount: 2,
      isOnline: true,
      lastMessage: {
        id: 'msg1',
        threadId: '1',
        senderId: 'user2',
        content: 'Hey! Are you free for coffee later?',
        type: 'text',
        createdAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      participants: ['user1', 'user3'],
      otherUserName: 'Bob Smith',
      otherUserAvatar: 'https://via.placeholder.com/50',
      unreadCount: 0,
      isOnline: false,
      lastMessage: {
        id: 'msg2',
        threadId: '2',
        senderId: 'user1',
        content: 'Thanks for the recommendation!',
        type: 'text',
        createdAt: new Date(Date.now() - 3600000),
      },
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 3600000),
    },
    {
      id: '3',
      participants: ['user1', 'user4'],
      otherUserName: 'Carol Davis',
      otherUserAvatar: 'https://via.placeholder.com/50',
      unreadCount: 1,
      isOnline: true,
      lastMessage: {
        id: 'msg3',
        threadId: '3',
        senderId: 'user4',
        content: 'Photo',
        type: 'image',
        createdAt: new Date(Date.now() - 7200000),
      },
      createdAt: new Date(Date.now() - 172800000),
      updatedAt: new Date(Date.now() - 7200000),
    },
  ];

  useEffect(() => {
    loadChats();
  }, []);

  const loadSettings = async () => {
    // Settings are now handled by Redux store
    // No need to manually set dark mode here
  };

  const loadChats = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setChats(mockChats);
    } catch (error) {
      Alert.alert('Error', 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleChatPress = (chat: ChatItem) => {
    Alert.alert('Open Chat', `Open conversation with ${chat.otherUserName}`);
    // Mark as read
    setChats(prev =>
      prev.map(c =>
        c.id === chat.id ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  const handleNewChat = () => {
    Alert.alert('New Chat', 'Start a new conversation');
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      style={[styles.chatItem, { borderBottomColor: currentTheme.border }]}
      onPress={() => handleChatPress(item)}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: item.otherUserAvatar || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        {item.isOnline && <View style={[styles.onlineIndicator, { borderColor: currentTheme.background }]} />}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, { color: currentTheme.text }]}>{item.otherUserName}</Text>
          <Text style={[styles.chatTime, { color: currentTheme.textSecondary }]}>
            {item.lastMessage && formatTime(item.lastMessage.createdAt)}
          </Text>
        </View>

        <View style={styles.chatFooter}>
          <Text style={[styles.lastMessage, { color: currentTheme.textSecondary }, item.unreadCount > 0 && [styles.unreadMessage, { color: currentTheme.text }]]} numberOfLines={1}>
            {item.lastMessage?.type === 'image' ? '📷 Photo' : item.lastMessage?.content || 'No messages yet'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color={currentTheme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>No Conversations</Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
        Start a conversation with someone nearby
      </Text>
      <TouchableOpacity style={styles.startChatButton} onPress={handleNewChat}>
        <Text style={styles.startChatButtonText}>Start a Chat</Text>
      </TouchableOpacity>
    </View>
  );

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Chats</Text>
        <TouchableOpacity onPress={handleNewChat}>
          <Ionicons name="create-outline" size={24} color={currentTheme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: currentTheme.surface }]}>
          <Ionicons name="search" size={20} color={currentTheme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: currentTheme.text }]}
            placeholder="Search conversations"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={currentTheme.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={currentTheme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredChats.length === 0 ? styles.emptyContainer : undefined}
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
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
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
    backgroundColor: '#4CAF50',
    borderWidth: 2,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  chatTime: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  unreadMessage: {
    fontFamily: FONTS.medium,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  unreadCount: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  startChatButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  startChatButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});