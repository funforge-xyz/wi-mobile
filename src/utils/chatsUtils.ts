
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

export const updateUserLastSeen = async () => {
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

export const handleDeclineRequest = async (request: ConnectionRequest, t: (key: string, fallback?: string) => string) => {
  Alert.alert(
    t('chats.declineRequest', 'Decline Request'),
    t('chats.declineRequestMessage', 'Are you sure you want to decline the request from {{user}}?', { user: request.firstName || t('profile.anonymousUser') }),
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          try {
            const firestore = getFirestore();
            await deleteDoc(doc(firestore, 'connectionRequests', request.id));
          } catch (error) {
            console.error('Error declining request:', error);
            Alert.alert('Error', 'Failed to decline request');
          }
        }
      }
    ]
  );
};

export const handleStartChat = (connection: Connection, navigation: any) => {
  navigation.navigate('Chat', {
    userId: connection.userId,
    userName: connection.firstName && connection.lastName ? `${connection.firstName} ${connection.lastName}` : 'Anonymous User',
    userPhotoURL: connection.photoURL || ''
  });
};

export const blockUser = async (userId: string, connectionId?: string) => {
  try {
    const { getAuth } = await import('../services/firebase');
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) return;

    const firestore = getFirestore();

    // Add to blocked users
    await addDoc(collection(firestore, 'blockedUsers'), {
      blockerUserId: currentUser.uid,
      blockedUserId: userId,
      blockedAt: new Date()
    });

    // Update connection status if connectionId is provided
    if (connectionId) {
      await updateDoc(doc(firestore, 'connections', connectionId), {
        status: 'blocked',
        blockedAt: new Date(),
        blockedBy: currentUser.uid
      });
    }
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
};

export const setupRealtimeListeners = async (
  setConnectionRequests: (requests: ConnectionRequest[]) => void,
  setConnections: (connections: Connection[]) => void,
  setLoading: (loading: boolean) => void
) => {
  try {
    const { getAuth } = await import('../services/firebase');
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) return { unsubscribeRequests: null, unsubscribeConnections: null };

    // Update user's lastSeen timestamp when app becomes active
    updateUserLastSeen();

    const firestore = getFirestore();

    // Real-time listener for connection requests (only pending ones)
    const requestsQuery = query(
      collection(firestore, 'connectionRequests'),
      where('toUserId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribeRequests = onSnapshot(requestsQuery, async (snapshot) => {
      const requests: ConnectionRequest[] = [];

      for (const requestDoc of snapshot.docs) {
        const requestData = requestDoc.data();

        // Get sender information
        const senderDoc = await getDoc(doc(firestore, 'users', requestData.fromUserId));
        const senderData = senderDoc.exists() ? senderDoc.data() : {};

        requests.push({
          id: requestDoc.id,
          userId: requestData.fromUserId,
          firstName: senderData.firstName || '',
          lastName: senderData.lastName || '',
          email: senderData.email || '',
          photoURL: senderData.photoURL || '',
          bio: senderData.bio || '',
          status: requestData.status,
          createdAt: requestData.createdAt?.toDate() || new Date(),
        });
      }

      requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setConnectionRequests(requests);
    });

    // Real-time listener for connections with live message updates
    const connectionsQuery = query(
      collection(firestore, 'connections'),
      where('participants', 'array-contains', currentUser.uid),
      where('status', '==', 'active')
    );

    // Set up listeners for each chat to get live message updates
    const chatListeners = new Map();

    const unsubscribeConnections = onSnapshot(connectionsQuery, async (snapshot) => {
      try {
        const connectionsMap = new Map();

        for (const connectionDoc of snapshot.docs) {
          const connectionData = connectionDoc.data();
          const otherParticipantId = connectionData.participants.find((id: string) => id !== currentUser.uid);

          if (otherParticipantId) {
            // Get other participant information
            const userDoc = await getDoc(doc(firestore, 'users', otherParticipantId));
            const userData = userDoc.exists() ? userDoc.data() : {};

            // Check if user is online
            const isOnline = userData.lastSeen && 
              userData.lastSeen.toDate && 
              (new Date().getTime() - userData.lastSeen.toDate().getTime()) < 2 * 60 * 1000;

            const baseConnection = {
              id: connectionDoc.id,
              userId: otherParticipantId,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              photoURL: userData.thumbnailURL || userData.photoURL || '',
              bio: userData.bio || '',
              connectedAt: connectionData.connectedAt?.toDate() || new Date(),
              lastMessage: '',
              lastMessageTime: undefined,
              isOnline,
              unreadCount: 0,
            };

            connectionsMap.set(connectionDoc.id, baseConnection);

            // Set up real-time listener for each chat
            if (connectionData.chatId && !chatListeners.has(connectionData.chatId)) {
              const chatDocRef = doc(firestore, 'chats', connectionData.chatId);

              const chatUnsubscribe = onSnapshot(chatDocRef, (chatDoc) => {
                if (chatDoc.exists()) {
                  const chatData = chatDoc.data();

                  // Update connection with latest message info
                  setConnections(prevConnections => {
                    const updatedConnections = prevConnections.map(conn => {
                      if (conn.id === connectionDoc.id) {
                        return {
                          ...conn,
                          lastMessage: chatData.lastMessage || '',
                          lastMessageTime: chatData.lastMessageTime?.toDate(),
                        };
                      }
                      return conn;
                    });

                    // Sort by last message time
                    updatedConnections.sort((a, b) => {
                      if (a.lastMessageTime && b.lastMessageTime) {
                        return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
                      } else if (a.lastMessageTime) {
                        return -1;
                      } else if (b.lastMessageTime) {
                        return 1;
                      } else {
                        return b.connectedAt.getTime() - a.connectedAt.getTime();
                      }
                    });

                    return updatedConnections;
                  });
                }
              });

              // Also listen for unread count changes
              const unreadQuery = query(
                collection(firestore, 'chats', connectionData.chatId, 'messages'),
                where('senderId', '==', otherParticipantId),
                where('read', '==', false)
              );

              const unreadUnsubscribe = onSnapshot(unreadQuery, (unreadSnapshot) => {
                const unreadCount = unreadSnapshot.size;

                setConnections(prevConnections => {
                  return prevConnections.map(conn => {
                    if (conn.id === connectionDoc.id) {
                      return { ...conn, unreadCount };
                    }
                    return conn;
                  });
                });
              });

              chatListeners.set(connectionData.chatId, () => {
                chatUnsubscribe();
                unreadUnsubscribe();
              });
            }

            // Get initial message data
            if (connectionData.chatId) {
              try {
                const chatDoc = await getDoc(doc(firestore, 'chats', connectionData.chatId));
                if (chatDoc.exists()) {
                  const chatData = chatDoc.data();
                  if (chatData.lastMessage) {
                    baseConnection.lastMessage = chatData.lastMessage;
                    baseConnection.lastMessageTime = chatData.lastMessageTime?.toDate();
                  }
                }

                // Get initial unread count
                const unreadQuery = query(
                  collection(firestore, 'chats', connectionData.chatId, 'messages'),
                  where('senderId', '==', otherParticipantId),
                  where('read', '==', false)
                );
                const unreadSnapshot = await getDocs(unreadQuery);
                baseConnection.unreadCount = unreadSnapshot.size;
              } catch (error) {
                console.log('Error fetching initial message data:', error);
              }
            }
          }
        }

        // Convert map to array and sort
        const connections = Array.from(connectionsMap.values());
        connections.sort((a, b) => {
          if (a.lastMessageTime && b.lastMessageTime) {
            return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
          } else if (a.lastMessageTime) {
            return -1;
          } else if (b.lastMessageTime) {
            return 1;
          } else {
            return b.connectedAt.getTime() - a.connectedAt.getTime();
          }
        });

        setConnections(connections);
        setLoading(false);
      } catch (error) {
        console.error('Error in connections listener:', error);
        setLoading(false);
      }
    });

    // Cleanup function for chat listeners
    const cleanupChatListeners = () => {
      chatListeners.forEach((unsubscribe: () => void) => unsubscribe());
      chatListeners.clear();
    };

    // Return cleanup function that includes chat listeners
    const originalUnsubscribe = unsubscribeConnections;
    const finalUnsubscribeConnections = () => {
      if (originalUnsubscribe) originalUnsubscribe();
      cleanupChatListeners();
    };

    return { unsubscribeRequests, unsubscribeConnections: finalUnsubscribeConnections };
  } catch (error) {
    console.error('Error setting up real-time listeners:', error);
    setLoading(false);
    return { unsubscribeRequests: null, unsubscribeConnections: null };
  }
};
