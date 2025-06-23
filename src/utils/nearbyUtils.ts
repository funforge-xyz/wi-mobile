
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';

export interface NearbyUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio: string;
  isOnline?: boolean;
}

export const loadNearbyUsers = async (currentUserId: string): Promise<NearbyUser[]> => {
  try {
    const firestore = getFirestore();

    // Run all Firestore queries in parallel
    const [blockedUsersSnapshot, blockedByUsersSnapshot, connectionsSnapshot, usersSnapshot] =
      await Promise.all([
        getDocs(
          query(
            collection(firestore, 'blockedUsers'),
            where('blockerUserId', '==', currentUserId)
          )
        ),
        getDocs(
          query(
            collection(firestore, 'blockedUsers'),
            where('blockedUserId', '==', currentUserId)
          )
        ),
        getDocs(
          query(
            collection(firestore, 'connections'),
            where('participants', 'array-contains', currentUserId),
            where('status', '==', 'active')
          )
        ),
        getDocs(collection(firestore, 'users')),
      ]);

    // Get blocked users
    const blockedUserIds = new Set<string>();
    blockedUsersSnapshot.forEach((doc) => {
      blockedUserIds.add(doc.data().blockedUserId);
    });

    // Get users who blocked current user
    blockedByUsersSnapshot.forEach((doc) => {
      blockedUserIds.add(doc.data().blockerUserId);
    });

    // Get connected users
    const connectedUserIds = new Set<string>();
    connectionsSnapshot.forEach((doc) => {
      const connectionData = doc.data();
      const otherParticipant = connectionData.participants.find(
        (id: string) => id !== currentUserId
      );
      if (otherParticipant) {
        connectedUserIds.add(otherParticipant);
      }
    });

    const now = Date.now();
    const users: NearbyUser[] = [];

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();

      // Exclude current user, blocked users, and connected users
      if (
        doc.id !== currentUserId &&
        !blockedUserIds.has(doc.id) &&
        !connectedUserIds.has(doc.id)
      ) {
        // Check if user is online (last seen within 2 minutes)
        const lastSeen = userData.lastSeen?.toDate?.();
        const isOnline = lastSeen && now - lastSeen.getTime() < 2 * 60 * 1000;

        users.push({
          id: doc.id,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          photoURL: userData.thumbnailURL || userData.photoURL || '',
          bio: userData.bio || '',
          isOnline: Boolean(isOnline),
        });
      }
    });

    return users;
  } catch (error) {
    console.error('Error loading users:', error);
    throw error;
  }
};


export const formatLastSeen = (timestamp: any, t: (key: string, options?: any) => string) => {
  if (!timestamp) return 'Unknown';

  const now = new Date();
  const lastSeen = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffInMs = now.getTime() - lastSeen.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays > 0) {
    return t('time.daysAgo', { count: diffInDays });
  } else if (diffInHours > 0) {
    return t('time.hoursAgo', { count: diffInHours });
  } else {
    return t('time.justNow');
  }
};

export const handleMessageUser = async (user: NearbyUser, currentUserId: string, navigation: any) => {
  try {
    const firestore = getFirestore();

    // Check if there's already a connection or request between users
    const existingConnectionQuery = query(
      collection(firestore, 'connections'),
      where('participants', 'array-contains', currentUserId)
    );
    const connectionsSnapshot = await getDocs(existingConnectionQuery);

    let hasConnection = false;
    connectionsSnapshot.forEach((doc) => {
      const connectionData = doc.data();
      if (connectionData.participants.includes(user.id) && connectionData.status === 'active') {
        hasConnection = true;
      }
    });

    // Check for existing requests
    const existingRequestQuery = query(
      collection(firestore, 'connectionRequests'),
      where('fromUserId', '==', currentUserId),
      where('toUserId', '==', user.id),
      where('status', '==', 'pending')
    );
    const requestSnapshot = await getDocs(existingRequestQuery);

    let hasRequest = false;
    if (!requestSnapshot.empty) {
      hasRequest = true;
    }

    // Navigate to chat screen with this user
    navigation.navigate('Chat', { 
      userId: user.id,
      userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Anonymous User',
      userPhotoURL: user.photoURL
    });
  } catch (error) {
    console.error('Error starting chat:', error);
    throw error;
  }
};
