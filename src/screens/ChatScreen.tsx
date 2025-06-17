import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, AppState, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import ChatHeader from '../components/ChatHeader';
import ChatStatusBanner from '../components/ChatStatusBanner';
import ChatMessagesList from '../components/ChatMessagesList';
import ChatEmptyState from '../components/ChatEmptyState';
import ChatInput from '../components/ChatInput';
import { chatStyles } from '../styles/ChatStyles';
import {
  Message,
  createChatRoomId,
  updateUserLastSeen,
  setupMessageListener,
  setupOnlineStatusListener,
  markMessagesAsRead,
  checkPendingRequestStatus,
  sendChatMessage,
} from '../utils/chatUtils';
import { useTranslation } from 'react-i18next';

interface ChatScreenProps {
  route: {
    params: {
      userId: string;
      userName: string;
      userPhotoURL?: string;
    };
  };
  navigation: any;
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
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

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
    React.useCallback(() => {
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

      // Set up real-time message listener
      setupMessageListener(
        roomId,
        setMessages,
        () => setLoading(false)
      );

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