
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, updateDoc, where, getDocs, setDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import { Alert } from 'react-native';
import { createNearbyRequestNotification } from '../services/notifications';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: Date;
  isFirstMessage?: boolean;
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
  onMessagesUpdate: (messages: Message[]) => void,
  onLoadingComplete: () => void
) => {
  const firestore = getFirestore();

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
    onMessagesUpdate(messagesList);
    onLoadingComplete();
  });

  return unsubscribe;
};

export const setupOnlineStatusListener = (
  userId: string,
  onStatusUpdate: (isOnline: boolean) => void
) => {
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

    const unreadQuery = query(
      collection(firestore, 'chats', chatRoomId, 'messages'),
      where('senderId', '==', userId),
      where('read', '==', false)
    );

    const unreadSnapshot = await getDocs(unreadQuery);

    if (unreadSnapshot.size > 0) {
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
      read: false,
    });

    // If this is the first message, send notification and create connection request
    if (isFirstMessage) {
      const currentUserDoc = await getDoc(doc(firestore, 'users', currentUserId));
      const currentUserData = currentUserDoc.data();
      
      await createNearbyRequestNotification(
        receiverId,
        currentUserData?.displayName || currentUserData?.name || 'Someone',
        currentUserData?.photoURL
      );

      await addDoc(collection(firestore, 'connectionRequests'), {
        fromUserId: currentUserId,
        toUserId: receiverId,
        status: 'pending',
        createdAt: new Date(),
        firstMessage: messageText,
        chatId: chatRoomId,
      });
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

export const formatTimeAgo = (date: Date, t: (key: string, options?: any) => string) => {
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
