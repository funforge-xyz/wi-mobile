import { Alert } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio: string;
  postsCount: number;
  connectionsCount: number;
}

export const loadUserProfileData = async (
  userId: string,
  initialData: { firstName?: string; lastName?: string; photoURL?: string; bio?: string },
  t: (key: string) => string
): Promise<UserProfile | null> => {
  try {
    const firestore = getFirestore();
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();

      return {
        id: userId,
        firstName: userData.firstName || initialData.firstName || '',
        lastName: userData.lastName || initialData.lastName || '',
        email: userData.email || '',
        photoURL: userData.photoURL || initialData.photoURL || '',
        bio: userData.bio || initialData.bio || '',
        postsCount: 0,
        connectionsCount: 0,
      };
    }
    return null;
  } catch (error) {
    console.error('Error loading user profile:', error);
    Alert.alert(t('common.error'), t('userProfile.failedToLoadProfile'));
    return null;
  }
};

export const handleBlockUserAction = async (
  userId: string,
  t: (key: string) => string,
  onSuccess: () => void
) => {
  try {
    const { getAuth, getFirestore } = await import('../services/firebase');
    const { addDoc, collection, serverTimestamp, query, where, getDocs, deleteDoc, doc, updateDoc } = await import('firebase/firestore');

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

    // Remove any existing connections
    const connectionsQuery = query(
      collection(firestore, 'connections'),
      where('participants', 'array-contains', currentUser.uid)
    );
    const connectionsSnapshot = await getDocs(connectionsQuery);

    for (const connectionDoc of connectionsSnapshot.docs) {
      const connectionData = connectionDoc.data();
      if (connectionData.participants.includes(userId)) {
        await deleteDoc(doc(firestore, 'connections', connectionDoc.id));
      }
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

    // Update Redux state to remove blocked user from nearby list and connections
    const { store } = await import('../store');
    const { removeBlockedUser } = await import('../store/nearbySlice');
    const { removeConnection } = await import('../store/connectionsSlice');

    store.dispatch(removeBlockedUser(userId));

    // Remove from connections state if exists
    const connections = store.getState().connections.connections;
    const connectionToRemove = connections.find(conn => 
      conn.participants.includes(userId)
    );
    if (connectionToRemove) {
      store.dispatch(removeConnection(connectionToRemove.id));
    }

    onSuccess();
  } catch (error) {
    console.error('Error blocking user:', error);
    throw new Error(t('userProfile.failedToBlock'));
  }
};

export const checkIfUserIsBlocked = async (userId: string): Promise<boolean> => {
  try {
    const { getAuth, getFirestore } = await import('../services/firebase');
    const { query, collection, where, getDocs } = await import('firebase/firestore');
    const auth = getAuth();
    const firestore = getFirestore();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return false;
    }

    // Check if current user blocked the target user
    const blockedByMeQuery = query(
      collection(firestore, 'blockedUsers'),
      where('blockedBy', '==', currentUser.uid),
      where('blockedUser', '==', userId)
    );

    // Check if target user blocked the current user
    const blockedMeQuery = query(
      collection(firestore, 'blockedUsers'),
      where('blockedBy', '==', userId),
      where('blockedUser', '==', currentUser.uid)
    );

    const [blockedByMeSnapshot, blockedMeSnapshot] = await Promise.all([
      getDocs(blockedByMeQuery),
      getDocs(blockedMeQuery)
    ]);

    return !blockedByMeSnapshot.empty || !blockedMeSnapshot.empty;
  } catch (error) {
    console.error('Error checking if user is blocked:', error);
    return false;
  }
};

export const getTheme = (isDarkMode: boolean) => {
  return isDarkMode ? {
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
  } : {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#000000',
    textSecondary: '#6C757D',
    border: '#E9ECEF',
  };
};