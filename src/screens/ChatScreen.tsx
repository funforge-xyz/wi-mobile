import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, updateDoc, where, getDocs, setDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import SkeletonLoader from '../components/SkeletonLoader';
import { createNearbyRequestNotification } from '../services/notifications';
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: Date;
  isFirstMessage?: boolean;
}

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
          width={style?.width || 32}
          height={style?.height || 32}
          borderRadius={style?.borderRadius || 16}
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


export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { userId, userName, userPhotoURL } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatRoomId, setChatRoomId] = useState('');
  const [userOnlineStatus, setUserOnlineStatus] = useState(false);
  const [pendingRequestStatus, setPendingRequestStatus] = useState<'none' | 'sent' | 'received'>('none');
  const flatListRef = useRef<FlatList>(null);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  const updateUserLastSeen = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();
      const userRef = doc(firestore, 'users', currentUser.uid);
      await setDoc(userRef, {
        lastSeen: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  };

  useEffect(() => {
    initializeChat();

    // Update user's lastSeen timestamp when component mounts
    updateUserLastSeen();

    // Handle app state changes to update lastSeen
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        updateUserLastSeen();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        updateUserLastSeen();
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
      // Small delay to ensure messages are loaded
      const timer = setTimeout(() => {
        markMessagesAsRead();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [chatRoomId, messages.length]);

  // Mark messages as read when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (chatRoomId) {
        // Small delay to ensure any new messages are loaded
        const timer = setTimeout(() => {
          markMessagesAsRead();
        }, 300);

        return () => clearTimeout(timer);
      }
    }, [chatRoomId])
  );

  const initializeChat = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      // Create chat room ID (consistent ordering)
      const roomId = [currentUser.uid, userId].sort().join('_');
      setChatRoomId(roomId);

      // Set up real-time message listener
      setupMessageListener(roomId);

      // Set up online status listener for the other user
      setupOnlineStatusListener();

      // Check for pending request status
      await checkPendingRequestStatus();

    } catch (error) {
      console.error('Error initializing chat:', error);
      setLoading(false);
    }
  };

  const checkPendingRequestStatus = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();

      // Check if current user sent a request to the other user
      const sentRequestQuery = query(
        collection(firestore, 'connectionRequests'),
        where('fromUserId', '==', currentUser.uid),
        where('toUserId', '==', userId),
        where('status', '==', 'pending')
      );
      const sentRequestSnapshot = await getDocs(sentRequestQuery);

      if (!sentRequestSnapshot.empty) {
        setPendingRequestStatus('sent');
        return;
      }

      // Check if the other user sent a request to current user
      const receivedRequestQuery = query(
        collection(firestore, 'connectionRequests'),
        where('fromUserId', '==', userId),
        where('toUserId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );
      const receivedRequestSnapshot = await getDocs(receivedRequestQuery);

      if (!receivedRequestSnapshot.empty) {
        setPendingRequestStatus('received');
        return;
      }

      setPendingRequestStatus('none');
    } catch (error) {
      console.error('Error checking pending request status:', error);
    }
  };

  const setupMessageListener = (roomId: string) => {
    const firestore = getFirestore();

    // Listen to messages
    const messagesQuery = query(
      collection(firestore, 'chats', roomId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messagesList.push({
          id: doc.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          text: data.text,
          createdAt: data.createdAt?.toDate() || new Date(),
          isFirstMessage: data.isFirstMessage || false,
        });
      });
      setMessages(messagesList);
      setLoading(false);

      // Auto-scroll to latest message
      setTimeout(() => {
        if (messagesList.length > 0 && flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    });

    return () => unsubscribe();
  };

  const setupOnlineStatusListener = () => {
    const firestore = getFirestore();
    const userRef = doc(firestore, 'users', userId);

    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        // Check if user is online (last seen within 2 minutes)
        const isOnline = userData.lastSeen && 
          userData.lastSeen.toDate && 
          (new Date().getTime() - userData.lastSeen.toDate().getTime()) < 2 * 60 * 1000;

        setUserOnlineStatus(isOnline);
      }
    });

    return () => unsubscribe();
  };

  const markMessagesAsRead = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser || !chatRoomId) return;

      const firestore = getFirestore();

      // Get all unread messages from the other user
      const unreadQuery = query(
        collection(firestore, 'chats', chatRoomId, 'messages'),
        where('senderId', '==', userId),
        where('read', '==', false)
      );

      const unreadSnapshot = await getDocs(unreadQuery);

      if (unreadSnapshot.size > 0) {
        // Mark each unread message as read
        const updatePromises = unreadSnapshot.docs.map(doc => 
          updateDoc(doc.ref, { read: true, readAt: new Date() })
        );

        await Promise.all(updatePromises);
        console.log(`Marked ${unreadSnapshot.size} messages as read`);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageToSend = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    try {
      setSending(true);
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();

      // Check if there's a pending request from the other user to current user (reply to request)
      const requestQuery = query(
        collection(firestore, 'connectionRequests'),
        where('fromUserId', '==', userId),
        where('toUserId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );
      const requestSnapshot = await getDocs(requestQuery);

      let isReplyToRequest = false;
      let requestId = null;

      if (!requestSnapshot.empty) {
        isReplyToRequest = true;
        requestId = requestSnapshot.docs[0].id;
      }

      // Check if this is the first message (no existing messages)
      const messagesQuery = query(
        collection(firestore, 'chats', chatRoomId, 'messages'),
        orderBy('createdAt', 'desc')
      );
      const existingMessages = await getDocs(messagesQuery);
      const isFirstMessage = existingMessages.empty;

      // Add message to chat
      await addDoc(collection(firestore, 'chats', chatRoomId, 'messages'), {
        senderId: currentUser.uid,
        receiverId: userId,
        text: messageToSend,
        createdAt: new Date(),
        read: false, // All messages start as unread
      });

      // If this is the first message, send notification and create connection request
      if (isFirstMessage) {
        // Get current user's data for notification
        const currentUserDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
        const currentUserData = currentUserDoc.data();
        
        // Send notification to the receiver
        await createNearbyRequestNotification(
          userId,
          currentUserData?.displayName || currentUserData?.name || 'Someone',
          currentUserData?.photoURL
        );

        // Create connection request
        await addDoc(collection(firestore, 'connectionRequests'), {
          fromUserId: currentUser.uid,
          toUserId: userId,
          status: 'pending',
          createdAt: new Date(),
          firstMessage: messageToSend,
          chatId: chatRoomId,
        });
      }

      // Update chat document with last message info
      const chatDocData = {
        participants: [currentUser.uid, userId],
        lastMessageTime: new Date(),
        lastMessage: messageToSend,
        lastMessageSender: currentUser.uid,
        updatedAt: new Date() // Add this to ensure real-time updates
      };

      await setDoc(doc(firestore, 'chats', chatRoomId), chatDocData, { merge: true });

      // If this is a reply to a request, create connection and update request
      if (isReplyToRequest && requestId) {
        // Create connection
        await addDoc(collection(firestore, 'connections'), {
          participants: [currentUser.uid, userId],
          connectedAt: new Date(),
          status: 'active',
          chatId: chatRoomId,
        });

        // Update the request status to 'accepted'
        await updateDoc(doc(firestore, 'connectionRequests', requestId), {
          status: 'accepted',
          acceptedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      // Restore the message if sending failed
      setNewMessage(messageToSend);
    } finally {
      setSending(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return t('time.daysAgo', { count: diffInDays });
    } else if (diffInHours > 0) {
      return t('time.hoursAgo', { count: diffInHours });
    } else if (diffInMinutes > 0) {
      return t('time.minutesAgo', { count: diffInMinutes });
    } else {
      return t('time.justNow');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const { getAuth } = require('../services/firebase');
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const isMyMessage = item.senderId === currentUser?.uid;

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : [styles.otherMessage, { backgroundColor: currentTheme.surface }]
      ]}>
        <Text style={[
          styles.messageText,
          { color: isMyMessage ? 'white' : currentTheme.text }
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.messageTime,
          { color: isMyMessage ? 'rgba(255,255,255,0.7)' : currentTheme.textSecondary }
        ]}>
          {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconContainer, { backgroundColor: currentTheme.surface }]}>
          <Ionicons name="chatbubbles-outline" size={48} color={currentTheme.textSecondary} />
        </View>
        <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
          {t('chats.startChatting')}
        </Text>
        <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
          {t('chats.sendMessage')} {userName}
        </Text>
        <View style={[styles.emptyHint, { backgroundColor: currentTheme.surface }]}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
          <Text style={[styles.emptyHintText, { color: currentTheme.textSecondary }]}>
            {t('nearby.sendRequest')}
          </Text>
        </View>
      </View>
    );
  };



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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerInfo}
          onPress={() => navigation.navigate('UserProfile', { userId })}
        >
          <View style={styles.avatarContainer}>
            {userPhotoURL ? (
               <AvatarImage source={{ uri: userPhotoURL }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatarPlaceholder, { backgroundColor: currentTheme.border }]}>
                <Ionicons name="person" size={20} color={currentTheme.textSecondary} />
              </View>
            )}
            {userOnlineStatus && <View style={[styles.onlineIndicator, { borderColor: currentTheme.background }]} />}
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{userName}</Text>
            {userOnlineStatus && (
              <Text style={[styles.onlineStatus, { color: COLORS.success }]}>{t('chat.online')}</Text>
            )}
          </View>
        </TouchableOpacity>
        <View style={{ width: 24 }} />
      </View>

      {pendingRequestStatus === 'sent' && messages.length > 0 && (
        <View style={styles.statusBannerContainer}>
          <View style={[styles.statusPill, { backgroundColor: COLORS.warning + '15', borderColor: COLORS.warning + '30' }]}>
            <Ionicons name="time-outline" size={14} color={COLORS.warning} />
            <Text style={[styles.statusPillText, { color: COLORS.warning }]}>
              {t('nearby.requestSent')} • {t('common.loading')}
            </Text>
          </View>
        </View>
      )}

      {messages.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.inputContainer, { 
          backgroundColor: currentTheme.surface,
          borderTopColor: currentTheme.border
        }]}
      >
        <TextInput
          style={[styles.textInput, { 
            backgroundColor: currentTheme.background,
            color: currentTheme.text,
            borderColor: currentTheme.border
          }]}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder={t('chat.messageInput')}
          placeholderTextColor={currentTheme.textSecondary}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, { 
            backgroundColor: newMessage.trim() ? COLORS.primary : currentTheme.border 
          }]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    zIndex: 1,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.medium,
  },
  onlineStatus: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  statusContainer: {
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  messageTime: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: SPACING.sm,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    maxWidth: '90%',
  },
  emptyHintText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.xs,
    textAlign: 'center',
  },
  statusBannerContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.xs,
  },
});