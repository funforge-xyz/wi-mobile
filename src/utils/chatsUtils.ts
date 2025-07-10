import { collection, getDocs, doc, getDoc, query, orderBy, where, addDoc, updateDoc, deleteDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import { Alert } from 'react-native';

export interface ConnectionRequest {
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

export interface Connection {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio: string;
  connectedAt: Date;
  lastMessage?: string;
  lastMessageTime?: Date;
  isOnline?: boolean;
  unreadCount?: number;
}



export const formatTimeAgo = (date: Date, t: (key: string, options?: any) => string) => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 6) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } else if (diffInDays > 0) {
    return t('time.daysAgo', { count: diffInDays });
  } else if (diffInHours > 0) {
    return t('time.hoursAgo', { count: diffInHours });
  } else if (diffInMinutes > 0) {
    return t('time.minutesAgo', { count: diffInMinutes });
  } else {
    return t('time.justNow');
  }
};

export const handleReplyToRequest = (request: ConnectionRequest, navigation: any) => {
  navigation.navigate('Chat', {
    userId: request.userId,
    userName: request.firstName && request.lastName ? `${request.firstName} ${request.lastName}` : 'Anonymous User',
    userPhotoURL: request.photoURL || ''
  });
};

// Decline request handling is now done in ChatsScreen component with custom modals

export const handleStartChat = (connection: Connection, navigation: any) => {
  navigation.navigate('Chat', {
    userId: connection.userId,
    userName: connection.firstName && connection.lastName ? `${connection.firstName} ${connection.lastName}` : 'Anonymous User',
    userPhotoURL: connection.photoURL || ''
  });
};

export const blockUser = async (userId: string, connectionId: string) => {
  try {
    const { getAuth, getFirestore } = await import('../services/firebase');
    const { addDoc, collection, serverTimestamp, doc, deleteDoc, query, where, getDocs } = await import('firebase/firestore');

    const auth = getAuth();
    const firestore = getFirestore();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    // Add to blockedUsers collection
    await addDoc(collection(firestore, 'blockedUsers'), {
      blockedBy: currentUser.uid,
      blockedUser: userId,
      createdAt: serverTimestamp(),
    });

    // Delete the connection entirely
    if (connectionId) {
      await deleteDoc(doc(firestore, 'connections', connectionId));
    }

    // Remove any pending connection requests (sent by current user)
    const sentRequestsQuery = query(
      collection(firestore, 'connectionRequests'),
      where('fromUserId', '==', currentUser.uid),
      where('toUserId', '==', userId)
    );
    const sentRequestsSnapshot = await getDocs(sentRequestsQuery);
    
    for (const requestDoc of sentRequestsSnapshot.docs) {
      await deleteDoc(doc(firestore, 'connectionRequests', requestDoc.id));
    }

    // Remove any pending connection requests (sent by blocked user)
    const receivedRequestsQuery = query(
      collection(firestore, 'connectionRequests'),
      where('fromUserId', '==', userId),
      where('toUserId', '==', currentUser.uid)
    );
    const receivedRequestsSnapshot = await getDocs(receivedRequestsQuery);
    
    for (const requestDoc of receivedRequestsSnapshot.docs) {
      await deleteDoc(doc(firestore, 'connectionRequests', requestDoc.id));
    }

    // Remove nearby_request notifications sent by current user to others
    const nearbyNotificationsQuery = query(
      collection(firestore, 'notifications'),
      where('fromUserId', '==', currentUser.uid),
      where('type', '==', 'nearby_request')
    );
    const nearbyNotificationsSnapshot = await getDocs(nearbyNotificationsQuery);

    for (const notificationDoc of nearbyNotificationsSnapshot.docs) {
      await deleteDoc(doc(firestore, 'notifications', notificationDoc.id));
    }

    // Update Redux state to remove blocked user from nearby list and connections
    const { store } = await import('../store');
    const { removeBlockedUser } = await import('../store/nearbySlice');
    const { removeConnection } = await import('../store/connectionsSlice');
    
    store.dispatch(removeBlockedUser(userId));
    if (connectionId) {
      store.dispatch(removeConnection(connectionId));
    }

    console.log('User blocked successfully');
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
};

export const setupRealtimeListeners = async (
  setConnectionRequests: (requests: ConnectionRequest[]) => void,
  setConnections: (connections: Connection[]) => void,
  setLoading: (loading: boolean) => void
): Promise<{ unsubscribeRequests: (() => void) | null; unsubscribeConnections: (() => void) | null }> => {
  try {
    const { getAuth } = await import('../services/firebase');
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) return { unsubscribeRequests: null, unsubscribeConnections: null };

    const firestore = getFirestore();
    const now = Date.now();

    // Get blocked users (both directions)
    const getBlockedUserIds = async () => {
      const [blockedByMeQuery, blockedMeQuery] = await Promise.all([
        getDocs(query(
          collection(firestore, 'blockedUsers'),
          where('blockedBy', '==', currentUser.uid)
        )),
        getDocs(query(
          collection(firestore, 'blockedUsers'),
          where('blockedUser', '==', currentUser.uid)
        ))
      ]);

      return new Set([
        ...blockedByMeQuery.docs.map(doc => doc.data().blockedUser),
        ...blockedMeQuery.docs.map(doc => doc.data().blockedBy)
      ]);
    };

    // Real-time listener for connection requests (only pending ones)
    const requestsQuery = query(
      collection(firestore, 'connectionRequests'),
      where('toUserId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribeRequests = onSnapshot(requestsQuery, async (snapshot) => {
      const blockedUserIds = await getBlockedUserIds();
      
      const requestPromises = snapshot.docs.map(async (requestDoc) => {
        const requestData = requestDoc.data();
        
        // Skip if user is blocked
        if (blockedUserIds.has(requestData.fromUserId)) {
          return null;
        }

        const senderDoc = await getDoc(doc(firestore, 'users', requestData.fromUserId));
        const senderData = senderDoc.exists() ? senderDoc.data() : {};

        return {
          id: requestDoc.id,
          userId: requestData.fromUserId,
          firstName: senderData.firstName || '',
          lastName: senderData.lastName || '',
          email: senderData.email || '',
          photoURL: senderData.photoURL || '',
          bio: senderData.bio || '',
          status: requestData.status,
          createdAt: requestData.createdAt?.toDate() || new Date(),
        };
      });

      const allRequests = await Promise.all(requestPromises);
      const requests = allRequests.filter(request => request !== null) as ConnectionRequest[];
      requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setConnectionRequests(requests);
    });

    const chatListeners = new Map();
    const connectionsQuery = query(
      collection(firestore, 'connections'),
      where('participants', 'array-contains', currentUser.uid),
      where('status', '==', 'active')
    );

    const unsubscribeConnections = onSnapshot(connectionsQuery, async (snapshot) => {
      try {
        const connectionsMap = new Map();
        const blockedUserIds = await getBlockedUserIds();

        const connectionPromises = snapshot.docs.map(async (connectionDoc): Promise<void> => {
          const connectionData = connectionDoc.data();
          const otherUserId = connectionData.participants?.find((id: string) => id !== currentUser.uid);
          if (!otherUserId) return;

          // Skip if user is blocked
          if (blockedUserIds.has(otherUserId)) {
            return;
          }

          const userDoc = await getDoc(doc(firestore, 'users', otherUserId));
          const userData = userDoc.exists() ? userDoc.data() : {};
          // const isOnline = userData?.lastSeen?.toDate && (now - userData.lastSeen.toDate().getTime() < 2 * 60 * 1000);

          const baseConnection: Connection = {
            id: connectionDoc.id,
            userId: otherUserId,
            firstName: userData?.firstName || '',
            lastName: userData?.lastName || '',
            email: userData?.email || '',
            photoURL: userData?.thumbnailURL || userData?.photoURL || '',
            bio: userData?.bio || '',
            connectedAt: connectionData?.connectedAt?.toDate() || new Date(),
            lastMessage: '',
            lastMessageTime: undefined,
            // isOnline,
            unreadCount: 0,
          };

          // Real-time listener for chat if not already set
          if (connectionData?.chatId && !chatListeners.has(connectionData.chatId)) {
            const chatDocRef = doc(firestore, 'chats', connectionData.chatId);

            const chatUnsubscribe = onSnapshot(chatDocRef, (chatDoc) => {
              if (chatDoc.exists()) {
                const chatData = chatDoc.data();

                setConnections((prev: Connection[]) =>
                  prev
                    .map((conn): Connection =>
                      conn.id === connectionDoc.id
                        ? {
                            ...conn,
                            lastMessage: chatData?.lastMessage || '',
                            lastMessageTime: chatData?.lastMessageTime?.toDate(),
                          }
                        : conn
                    )
                    .sort((a, b) =>
                      (b.lastMessageTime?.getTime() || 0) - (a.lastMessageTime?.getTime() || 0)
                    )
                );
              }
            });

            const unreadQuery = query(
              collection(firestore, 'chats', connectionData?.chatId!, 'messages'),
              where('senderId', '==', otherUserId),
              where('read', '==', false)
            );

            const unreadUnsubscribe = onSnapshot(unreadQuery, (unreadSnapshot) => {
              const unreadCount = unreadSnapshot.size;
              setConnections((prev: Connection[]) =>
                prev.map((conn): Connection =>
                  conn.id === connectionDoc.id ? { ...conn, unreadCount } : conn
                )
              );
            });

            chatListeners.set(connectionData?.chatId!, () => {
              chatUnsubscribe();
              unreadUnsubscribe();
            });
          }

          // Initial chat data (for mount)
          if (connectionData?.chatId) {
            try {
              const [chatDoc, unreadSnap] = await Promise.all([
                getDoc(doc(firestore, 'chats', connectionData.chatId)),
                getDocs(
                  query(
                    collection(firestore, 'chats', connectionData.chatId, 'messages'),
                    where('senderId', '==', otherUserId),
                    where('read', '==', false)
                  )
                ),
              ]);

              if (chatDoc.exists()) {
                const chatData = chatDoc.data();
                baseConnection.lastMessage = chatData?.lastMessage || '';
                baseConnection.lastMessageTime = chatData?.lastMessageTime?.toDate();
              }

              baseConnection.unreadCount = unreadSnap.size;
            } catch (err) {
              console.log('Error fetching chat data:', err);
            }
          }

          connectionsMap.set(connectionDoc.id, baseConnection);
        });

        await Promise.all(connectionPromises);

        const connections = Array.from(connectionsMap.values()).sort((a, b) => {
          if (a.lastMessageTime && b.lastMessageTime) {
            return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
          } else if (a.lastMessageTime) return -1;
          else if (b.lastMessageTime) return 1;
          return b.connectedAt.getTime() - a.connectedAt.getTime();
        });

        setConnections(connections);
        setLoading(false);
      } catch (error) {
        console.error('Error in connections listener:', error);
        setLoading(false);
      }
    });

    const cleanupChatListeners = () => {
      chatListeners.forEach((unsubscribe) => unsubscribe());
      chatListeners.clear();
    };

    return {
      unsubscribeRequests,
      unsubscribeConnections: () => {
        if (unsubscribeConnections) unsubscribeConnections();
        cleanupChatListeners();
      },
    };
  } catch (error) {
    console.error('Error setting up real-time listeners:', error);
    setLoading(false);
    return { unsubscribeRequests: null, unsubscribeConnections: null };
  }
};