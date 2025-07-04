import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import ChatHeader from '../components/ChatHeader';
import ChatStatusBanner from '../components/ChatStatusBanner';
import ChatMessagesList from '../components/ChatMessagesList';
import ChatEmptyState from '../components/ChatEmptyState';
import ChatInput from '../components/ChatInput';
import { createChatStyles } from '../styles/ChatStyles';
import {
  Message,
  createChatRoomId,
  updateUserLastSeen,
  setupMessageListener,
  setupOnlineStatusListener,
  markMessagesAsRead,
  checkPendingRequestStatus,
  sendChatMessage,
  loadMoreMessages,
} from '../utils/chatUtils';
import { useTranslation } from 'react-i18next';

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface ChatScreenProps {
  route: ChatScreenRouteProp;
  navigation: ChatScreenNavigationProp;
}

export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { userId, userName, userPhotoURL } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatRoomId, setChatRoomId] = useState('');
  const [userOnlineStatus, setUserOnlineStatus] = useState(false);
  const [pendingRequestStatus, setPendingRequestStatus] = useState<'none' | 'sent' | 'received'>('none');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messageUnsubscribe, setMessageUnsubscribe] = useState<(() => void) | null>(null);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const chatStyles = createChatStyles(isDarkMode);

  const currentTheme = {
    background: isDarkMode ? COLORS.darkBackground : COLORS.background,
    surface: isDarkMode ? COLORS.darkSurface : COLORS.surface,
    text: isDarkMode ? COLORS.darkText : COLORS.text,
    textSecondary: isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary,
    border: isDarkMode ? COLORS.darkBorder : COLORS.border,
  };

  useEffect(() => {
    initializeChat();

    // Update user's lastSeen timestamp when component mounts
    updateUserLastSeen(getCurrentUserId());

    // Handle app state changes to update lastSeen
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        updateUserLastSeen(getCurrentUserId());
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        updateUserLastSeen(getCurrentUserId());
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSubscription?.remove();
      // Clean up message listener
      if (messageUnsubscribe) {
        messageUnsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    // Mark messages as read when chat is opened or when new messages arrive
    if (chatRoomId) {
      const timer = setTimeout(() => {
        markMessagesAsRead(chatRoomId, userId, getCurrentUserId());
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [chatRoomId, messages.length]);

  // Mark messages as read when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (chatRoomId) {
        const timer = setTimeout(() => {
          markMessagesAsRead(chatRoomId, userId, getCurrentUserId());
        }, 300);

        return () => clearTimeout(timer);
      }
    }, [chatRoomId])
  );

  const getCurrentUserId = () => {
    const { getAuth } = require('../services/firebase');
    const auth = getAuth();
    return auth.currentUser?.uid || '';
  };

  const initializeChat = async () => {
    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) return;

      // Create chat room ID
      const roomId = createChatRoomId(currentUserId, userId);
      setChatRoomId(roomId);

      // Set up real-time message listener for initial 30 messages
      const unsubscribe = setupMessageListener(
        roomId,
        (newMessages) => {
          console.log('Initial messages loaded:', newMessages.length);
          setMessages(newMessages);
          // Check if we got less than the limit, meaning no more messages
          if (newMessages.length < 30) {
            setHasMoreMessages(false);
          } else {
            setHasMoreMessages(true);
          }
        },
        () => setLoading(false),
        30 // Initial limit
      );

      setMessageUnsubscribe(() => unsubscribe);

      // Set up online status listener for the other user
      setupOnlineStatusListener(userId, setUserOnlineStatus);

      // Check for pending request status
      const status = await checkPendingRequestStatus(currentUserId, userId);
      setPendingRequestStatus(status);

    } catch (error) {
      console.error('Error initializing chat:', error);
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageToSend = newMessage.trim();
    setNewMessage('');

    try {
      setSending(true);
      const currentUserId = getCurrentUserId();
      if (!currentUserId) return;

      // Create a wrapper function that matches the expected signature
      const translateWrapper = (key: string, fallback?: string) => {
        return fallback ? t(key, fallback) : t(key);
      };

      await sendChatMessage(
        messageToSend,
        chatRoomId,
        currentUserId,
        userId,
        translateWrapper
      );

    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageToSend);
    } finally {
      setSending(false);
    }
  };

  const handleHeaderPress = () => {
    navigation.navigate('UserProfile', { userId });
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMoreMessages || messages.length === 0) {
      console.log('LoadMore blocked:', { loadingMore, hasMoreMessages, messagesLength: messages.length });
      return;
    }
    
    console.log('Loading more messages...');
    setLoadingMore(true);
    
    try {
      const oldestMessage = messages[0];
      console.log('Oldest message timestamp:', oldestMessage.createdAt);
      
      const olderMessages = await loadMoreMessages(chatRoomId, oldestMessage, 30);
      console.log('Loaded older messages:', olderMessages.length);
      
      if (olderMessages.length > 0) {
        setMessages(prevMessages => {
          // Create a Set of existing message IDs to prevent duplicates
          const existingIds = new Set(prevMessages.map(msg => msg.id));
          
          // Filter out any messages that already exist
          const uniqueOlderMessages = olderMessages.filter(msg => !existingIds.has(msg.id));
          
          const newMessages = [...uniqueOlderMessages, ...prevMessages];
          console.log('Total messages after load more:', newMessages.length);
          console.log('Unique older messages added:', uniqueOlderMessages.length);
          return newMessages;
        });
      }
      
      // If we got less than the limit, no more messages available
      if (olderMessages.length < 30) {
        console.log('No more messages available');
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={[chatStyles.container, { backgroundColor: currentTheme.background }]}>
        <View style={chatStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[chatStyles.container, { backgroundColor: currentTheme.background }]}>
      <ChatHeader
        onBackPress={handleBackPress}
        onHeaderPress={handleHeaderPress}
        userName={userName}
        userPhotoURL={userPhotoURL}
        userOnlineStatus={userOnlineStatus}
        currentTheme={currentTheme}
        t={t}
      />

      <ChatStatusBanner
        pendingRequestStatus={pendingRequestStatus}
        t={t}
      />

      {messages.length === 0 ? (
        <ChatEmptyState
          userName={userName}
          currentTheme={currentTheme}
          t={t}
        />
      ) : (
        <ChatMessagesList
          messages={messages}
          currentUserId={getCurrentUserId()}
          currentTheme={currentTheme}
          onLoadMore={handleLoadMore}
          hasMoreMessages={hasMoreMessages}
          loadingMore={loadingMore}
        />
      )}

      <ChatInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={handleSendMessage}
        sending={sending}
        currentTheme={currentTheme}
        t={t}
      />
    </SafeAreaView>
  );
}