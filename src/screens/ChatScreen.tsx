
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, updateDoc, where, getDocs, setDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';

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

export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { userId, userName, userPhotoURL } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionRequestSent, setConnectionRequestSent] = useState(false);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    loadMessages();
    checkConnectionStatus();
  }, []);

  const loadMessages = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();
      
      // Create chat room ID (consistent ordering)
      const chatRoomId = [currentUser.uid, userId].sort().join('_');
      
      // Listen to messages
      const messagesQuery = query(
        collection(firestore, 'chats', chatRoomId, 'messages'),
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
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error loading messages:', error);
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();

      // Check if already connected
      const connectionsQuery = query(
        collection(firestore, 'connections'),
        where('participants', 'array-contains', currentUser.uid)
      );
      const connectionsSnapshot = await getDocs(connectionsQuery);
      
      let connected = false;
      connectionsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(userId)) {
          connected = true;
        }
      });

      setIsConnected(connected);

      // Check if connection request was sent
      const requestsQuery = query(
        collection(firestore, 'connectionRequests'),
        where('fromUserId', '==', currentUser.uid),
        where('toUserId', '==', userId),
        where('status', '==', 'pending')
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      setConnectionRequestSent(!requestsSnapshot.empty);

    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();
      const chatRoomId = [currentUser.uid, userId].sort().join('_');

      const isFirstMessage = messages.length === 0 && !connectionRequestSent;

      // Add message to chat
      await addDoc(collection(firestore, 'chats', chatRoomId, 'messages'), {
        senderId: currentUser.uid,
        receiverId: userId,
        text: newMessage.trim(),
        createdAt: new Date(),
        isFirstMessage,
      });

      // Update chat room metadata
      await updateDoc(doc(firestore, 'chats', chatRoomId), {
        participants: [currentUser.uid, userId],
        lastMessage: newMessage.trim(),
        lastMessageTime: new Date(),
        lastMessageSenderId: currentUser.uid,
      }).catch(async () => {
        // If chat room doesn't exist, create it
        await addDoc(collection(firestore, 'chats'), {
          participants: [currentUser.uid, userId],
          lastMessage: newMessage.trim(),
          lastMessageTime: new Date(),
          lastMessageSenderId: currentUser.uid,
        });
      });

      // Update chat document with last message info
      const chatRef = doc(firestore, 'chats', chatRoomId);
      await setDoc(chatRef, {
        participants: [currentUser.uid, userId],
        lastMessageTime: new Date(),
        lastMessage: newMessage.trim(),
        lastMessageSender: currentUser.uid
      }, { merge: true });

      // If this is the first message, create connection request
      if (isFirstMessage) {
        await addDoc(collection(firestore, 'connectionRequests'), {
          fromUserId: currentUser.uid,
          toUserId: userId,
          status: 'pending',
          createdAt: new Date(),
          firstMessageSent: true,
          chatRoomId: chatRoomId
        });
        setConnectionRequestSent(true);
      } else {
        // Check if this is a reply to a first message (should create connection)
        const existingRequestQuery = query(
          collection(firestore, 'connectionRequests'),
          where('fromUserId', '==', userId),
          where('toUserId', '==', currentUser.uid),
          where('status', '==', 'pending')
        );
        const existingRequestSnapshot = await getDocs(existingRequestQuery);
        
        if (!existingRequestSnapshot.empty && !isConnected) {
          // This is a reply to a first message - connection will be created by Firebase function
          // Update local state
          setIsConnected(true);
          setConnectionRequestSent(false);
        }
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
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
        isMyMessage ? styles.myMessage : styles.otherMessage
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

  const renderConnectionStatus = () => {
    if (isConnected) {
      return (
        <View style={[styles.statusContainer, { backgroundColor: COLORS.success + '20' }]}>
          <Text style={[styles.statusText, { color: COLORS.success }]}>
            You are connected with {userName}
          </Text>
        </View>
      );
    } else if (connectionRequestSent || messages.length > 0) {
      return (
        <View style={[styles.statusContainer, { backgroundColor: COLORS.warning + '20' }]}>
          <Text style={[styles.statusText, { color: COLORS.warning }]}>
            Waiting for {userName} to reply to connect
          </Text>
        </View>
      );
    }
    return null;
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
        <View style={styles.headerInfo}>
          {userPhotoURL ? (
            <Image source={{ uri: userPhotoURL }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatarPlaceholder, { backgroundColor: currentTheme.border }]}>
              <Ionicons name="person" size={20} color={currentTheme.textSecondary} />
            </View>
          )}
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{userName}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {renderConnectionStatus()}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.inputContainer, { backgroundColor: currentTheme.surface }]}
      >
        <TextInput
          style={[styles.textInput, { 
            backgroundColor: currentTheme.background,
            color: currentTheme.text,
            borderColor: currentTheme.border
          }]}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
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
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: SPACING.sm,
  },
  headerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.medium,
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
    backgroundColor: '#E8E8E8',
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
});
