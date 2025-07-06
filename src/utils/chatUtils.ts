import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, updateDoc, where, getDocs, setDoc, limit as firestoreLimit, startAfter, Timestamp } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import { Alert } from 'react-native';
import { createNearbyRequestNotification } from '../services/notifications';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: Date;
  deliveredAt?: Date;
  seenAt?: Date;
  isFirstMessage?: boolean;
  read?: boolean;
  readAt?: Date;
}

export const createChatRoomId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

export const updateUserLastSeen = async (currentUserId: string) => {
  try {
    if (!currentUserId) return;

    const firestore = getFirestore();
    const userRef = doc(firestore, 'users', currentUserId);
    await setDoc(userRef, {
      lastSeen: new Date(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating last seen:', error);
  }
};

export const setupMessageListener = (
  chatRoomId: string,
  setMessages: (messages: Message[]) => void,
  onLoadComplete?: () => void,
  limit: number = 30
) => {
  try {
    const db = getFirestore();
    const messagesRef = collection(db, 'chats', chatRoomId, 'messages');
    const q = query(
      messagesRef, 
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: Message[] = [];
      const seenIds = new Set<string>();

      snapshot.forEach((doc) => {
        // Check for duplicates
        if (seenIds.has(doc.id)) {
          console.warn('Duplicate message detected:', doc.id);
          return;
        }
        seenIds.add(doc.id);

        const data = doc.data();
        messagesData.push({
          id: doc.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          text: data.text,
          createdAt: data.createdAt?.toDate() || new Date(),
          deliveredAt: data.deliveredAt?.toDate(),
          seenAt: data.seenAt?.toDate(),
          isFirstMessage: data.isFirstMessage || false,
          read: data.read || false,
          readAt: data.readAt?.toDate(),
        });
      });

      console.log('Real-time listener loaded messages:', messagesData.length);
      // Keep descending order for inverted FlatList (newest first)
      setMessages(messagesData);
      if (onLoadComplete) onLoadComplete();
    }, (error) => {
      console.error('Error listening to messages:', error);
      if (onLoadComplete) onLoadComplete();
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up message listener:', error);
    if (onLoadComplete) onLoadComplete();
    return () => {};
  }
};

export const loadMoreMessages = async (
  chatRoomId: string,
  lastMessage: Message,
  limit: number = 30
): Promise<Message[]> => {
  try {
    console.log('Loading more messages for chatRoom:', chatRoomId, 'before:', lastMessage.createdAt);

    const db = getFirestore();
    const messagesRef = collection(db, 'chats', chatRoomId, 'messages');

    // Convert lastMessage createdAt to Firestore Timestamp for cursor
    const lastMessageTimestamp = Timestamp.fromDate(lastMessage.createdAt);

    const q = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      startAfter(lastMessageTimestamp),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    const olderMessages: Message[] = [];
    const seenIds = new Set<string>();

    snapshot.forEach((doc) => {
      // Check for duplicates
      if (seenIds.has(doc.id)) {
        console.warn('Duplicate message in loadMore detected:', doc.id);
        return;
      }
      seenIds.add(doc.id);

      const data = doc.data();
      olderMessages.push({
        id: doc.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        text: data.text,
        createdAt: data.createdAt?.toDate() || new Date(),
        deliveredAt: data.deliveredAt?.toDate(),
        seenAt: data.seenAt?.toDate(),
        isFirstMessage: data.isFirstMessage || false,
        read: data.read || false,
        readAt: data.readAt?.toDate(),
      });
    });

    console.log('Fetched', olderMessages.length, 'older messages');

    // Return messages in descending order (newest first) to match inverted FlatList
    return olderMessages;
  } catch (error) {
    console.error('Error loading more messages:', error);
    return [];
  }
};

export const setupOnlineStatusListener = (
  userId: string,
  onStatusUpdate: (isOnline: boolean) => void
): (() => void) => {
  const firestore = getFirestore();
  const userRef = doc(firestore, 'users', userId);

  const unsubscribe = onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      const userData = doc.data();
      const isOnline = userData.lastSeen && 
        userData.lastSeen.toDate && 
        (new Date().getTime() - userData.lastSeen.toDate().getTime()) < 2 * 60 * 1000;

      onStatusUpdate(isOnline);
    }
  });

  return unsubscribe;
};

export const markMessagesAsRead = async (chatRoomId: string, userId: string, currentUserId: string) => {
  try {
    if (!currentUserId || !chatRoomId) return;

    const firestore = getFirestore();

    // Mark messages as seen (from other user that haven't been seen)
    const unseenQuery = query(
      collection(firestore, 'chats', chatRoomId, 'messages'),
      where('senderId', '==', userId),
      where('seenAt', '==', null)
    );

    const unseenSnapshot = await getDocs(unseenQuery);

    if (unseenSnapshot.size > 0) {
      const updatePromises = unseenSnapshot.docs.map(doc => 
        updateDoc(doc.ref, { 
          seenAt: new Date(),
          read: true, 
          readAt: new Date() 
        })
      );

      await Promise.all(updatePromises);
      console.log(`Marked ${unseenSnapshot.size} messages as seen`);
    }
  } catch (error) {
    console.error('Error marking messages as seen:', error);
  }
};

export const checkPendingRequestStatus = async (
  currentUserId: string,
  userId: string
): Promise<'none' | 'sent' | 'received'> => {
  try {
    if (!currentUserId) return 'none';

    const firestore = getFirestore();

    // Check if current user sent a request to the other user
    const sentRequestQuery = query(
      collection(firestore, 'connectionRequests'),
      where('fromUserId', '==', currentUserId),
      where('toUserId', '==', userId),
      where('status', '==', 'pending')
    );
    const sentRequestSnapshot = await getDocs(sentRequestQuery);

    if (!sentRequestSnapshot.empty) {
      return 'sent';
    }

    // Check if the other user sent a request to current user
    const receivedRequestQuery = query(
      collection(firestore, 'connectionRequests'),
      where('fromUserId', '==', userId),
      where('toUserId', '==', currentUserId),
      where('status', '==', 'pending')
    );
    const receivedRequestSnapshot = await getDocs(receivedRequestQuery);

    if (!receivedRequestSnapshot.empty) {
      return 'received';
    }

    return 'none';
  } catch (error) {
    console.error('Error checking pending request status:', error);
    return 'none';
  }
};

export const sendChatMessage = async (
  messageText: string,
  chatRoomId: string,
  currentUserId: string,
  receiverId: string,
  t: (key: string, fallback?: string) => string
) => {
  try {
    const firestore = getFirestore();

    // Check if there's a pending request from the other user to current user (reply to request)
    const requestQuery = query(
      collection(firestore, 'connectionRequests'),
      where('fromUserId', '==', receiverId),
      where('toUserId', '==', currentUserId),
      where('status', '==', 'pending')
    );
    const requestSnapshot = await getDocs(requestQuery);

    let isReplyToRequest = false;
    let requestId = null;

    if (!requestSnapshot.empty) {
      isReplyToRequest = true;
      requestId = requestSnapshot.docs[0].id;
    }

    // Check if there's an existing pending connection request
    const existingConnectionRequestQuery = query(
      collection(firestore, 'connectionRequests'),
      where('fromUserId', '==', currentUserId),
      where('toUserId', '==', receiverId),
      where('status', '==', 'pending')
    );
    const existingConnectionRequestSnapshot = await getDocs(existingConnectionRequestQuery);
    const hasExistingRequest = !existingConnectionRequestSnapshot.empty;

    // Check if this is the first message
    const messagesQuery = query(
      collection(firestore, 'chats', chatRoomId, 'messages'),
      orderBy('createdAt', 'desc')
    );
    const existingMessages = await getDocs(messagesQuery);
    const isFirstMessage = existingMessages.empty;

    // Add message to chat
    await addDoc(collection(firestore, 'chats', chatRoomId, 'messages'), {
      senderId: currentUserId,
      receiverId: receiverId,
      text: messageText,
      createdAt: new Date(),
      deliveredAt: new Date(), // Mark as delivered immediately
      seenAt: null, // Will be updated when recipient sees it
      read: false,
    });

    // Create connection request if no existing pending request AND not replying to a request
    if (!hasExistingRequest && !isReplyToRequest) {
      // Use the createConnectionRequest function which handles Redux state updates
      await createConnectionRequest(currentUserId, receiverId, t);
      
      // Update the connection request with additional chat-specific data
      const connectionRequestQuery = query(
        collection(firestore, 'connectionRequests'),
        where('fromUserId', '==', currentUserId),
        where('toUserId', '==', receiverId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const connectionRequestSnapshot = await getDocs(connectionRequestQuery);
      
      if (!connectionRequestSnapshot.empty) {
        const requestDoc = connectionRequestSnapshot.docs[0];
        await updateDoc(requestDoc.ref, {
          firstMessage: messageText,
          chatId: chatRoomId,
        });
      }
    }

    // Update chat document with last message info
    const chatDocData = {
      participants: [currentUserId, receiverId],
      lastMessageTime: new Date(),
      lastMessage: messageText,
      lastMessageSender: currentUserId,
      updatedAt: new Date(),
    };

    await setDoc(doc(firestore, 'chats', chatRoomId), chatDocData, { merge: true });

    // If this is a reply to a request, create connection and update request
    if (isReplyToRequest && requestId) {
      await addDoc(collection(firestore, 'connections'), {
        participants: [currentUserId, receiverId],
        connectedAt: new Date(),
        status: 'active',
        chatId: chatRoomId,
      });

      await updateDoc(doc(firestore, 'connectionRequests', requestId), {
        status: 'accepted',
        acceptedAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    Alert.alert('Error', 'Failed to send message');
    throw error;
  }
};

export const formatTimeAgo = (date: Date, t: (key: string, options?: { count?: number }) => string): string => {
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

export const createConnectionRequest = async (
  currentUserId: string,
  toUserId: string,
  t: (key: string, fallback?: string) => string
): Promise<{ success: boolean; requestId?: string }> => {
  try {
    const firestore = getFirestore();

    const currentUserDoc = await getDoc(doc(firestore, 'users', currentUserId));
    const currentUserData = currentUserDoc.data();

    await createNearbyRequestNotification(
      toUserId,
      currentUserData?.displayName || currentUserData?.name || 'Someone',
      currentUserData?.photoURL
    );

    const docRef = await addDoc(collection(firestore, 'connectionRequests'), {
      fromUserId: currentUserId,
      toUserId: toUserId,
      status: 'pending',
      createdAt: new Date(),
    });

    console.log('Connection request created successfully');

      // Remove user from nearby Redux state
      try {
        const { store } = await import('../store');
        const { removeBlockedUser } = await import('../store/nearbySlice');
        store.dispatch(removeBlockedUser(toUserId));
        console.log('User removed from nearby list:', toUserId);
      } catch (reduxError) {
        console.error('Error removing user from nearby list:', reduxError);
        // Don't throw here as the main operation succeeded
      }

      return { success: true, requestId: docRef.id };
    } catch (error) {
      console.error('Error creating connection request:', error);
      throw error;
    }
};