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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, updateDoc, where, getDocs, setDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import SkeletonLoader from '../components/SkeletonLoader';

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

const AvatarImage = ({ source, style }: { source: any; style: any }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [source?.uri]);

  return (
    <View style={style}>
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
        style={[style, { opacity: loading ? 0 : 1 }]}
        onLoadStart={() => {
          setLoading(true);
          setError(false);
        }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
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
  const flatListRef = useRef<FlatList>(null);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    initializeChat();
  }, []);

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

    } catch (error) {
      console.error('Error initializing chat:', error);
      setLoading(false);
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

      // Add message to chat
      await addDoc(collection(firestore, 'chats', chatRoomId, 'messages'), {
        senderId: currentUser.uid,
        receiverId: userId,
        text: messageToSend,
        createdAt: new Date(),
      });

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
          {userPhotoURL ? (
             <AvatarImage source={{ uri: userPhotoURL }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatarPlaceholder, { backgroundColor: currentTheme.border }]}>
              <Ionicons name="person" size={20} color={currentTheme.textSecondary} />
            </View>
          )}
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{userName}</Text>
        </TouchableOpacity>
        <View style={{ width: 24 }} />
      </View>



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