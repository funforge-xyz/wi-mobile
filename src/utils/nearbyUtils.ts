import { getFirestore, GeoPoint } from '../services/firebase';
import { getAuth } from '../services/firebase';
import { collection, getDocs, doc, getDoc, query, where, setDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { GeoFirestore } from 'geofirestore';

export interface NearbyUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio: string;
  isOnline?: boolean;
}

export const loadNearbyUsers = async (
  userRadius: number,
  currentUserLocation: { latitude: number; longitude: number } | null
): Promise<NearbyUser[]> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const firestore = getFirestore();

    // Get user settings and current network info
    const userDocRef = doc(firestore, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    const sameNetworkMatchingEnabled = userData?.sameNetworkMatching ?? true;
    const currentUserNetworkId = userData?.currentNetworkId;

    // Get blocked users, connections, and all users in parallel
    const [blockedUsersQuery, connectionsQuery, usersQuery] = await Promise.all([
      getDocs(query(
        collection(firestore, 'blocks'),
        where('blockerId', '==', currentUser.uid)
      )),
      getDocs(query(
        collection(firestore, 'connections'),
        where('participants', 'array-contains', currentUser.uid)
      )),
      getDocs(collection(firestore, 'users'))
    ]);

    const blockedUserIds = new Set(
      blockedUsersQuery.docs.map(doc => doc.data().blockedUserId)
    );

    const connectedUserIds = new Set(
      connectionsQuery.docs.flatMap(doc => 
        doc.data().participants.filter((id: string) => id !== currentUser.uid)
      )
    );

    const nearbyUsers: NearbyUser[] = [];
    const now = new Date();
    const onlineThreshold = 2 * 60 * 1000; // 2 minutes

    // Flutter-style filtering: users within bounding box OR same network
    usersQuery.docs.forEach(doc => {
      const userId = doc.id;
      const user = doc.data();

      // Skip current user, blocked users, and existing connections
      if (userId === currentUser.uid || 
          blockedUserIds.has(userId) || 
          connectedUserIds.has(userId)) {
        return;
      }

      const lastSeen = user.lastSeen?.toDate();
      const isOnline = lastSeen && (now.getTime() - lastSeen.getTime()) < onlineThreshold;

      // Check if user is on same network
      const isSameNetwork = sameNetworkMatchingEnabled && 
                           currentUserNetworkId && 
                           user.currentNetworkId === currentUserNetworkId;

      // Flutter logic: Include if (within bounding box AND within time frame) OR same network
      let shouldInclude = false;
      let distance = 0;

      if (isSameNetwork) {
        // Always include same network users (like Flutter)
        shouldInclude = true;
        // Calculate distance for sorting even if same network
        if (currentUserLocation && user.coordinates) {
          distance = calculateDistance(
            currentUserLocation.latitude,
            currentUserLocation.longitude,
            user.coordinates.latitude,
            user.coordinates.longitude
          );
        }
      } else if (currentUserLocation && user.coordinates) {
        // For non-same-network users, check distance and recent location update
        distance = calculateDistance(
          currentUserLocation.latitude,
          currentUserLocation.longitude,
          user.coordinates.latitude,
          user.coordinates.longitude
        );

        // Check if user has updated location recently (Flutter checks lastUpdatedLocation >= date_frame)
        const lastLocationUpdate = user.lastUpdatedLocation?.toDate();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const hasRecentLocationUpdate = lastLocationUpdate && lastLocationUpdate >= fiveMinutesAgo;

        shouldInclude = distance <= userRadius && hasRecentLocationUpdate;
      }

      if (shouldInclude) {
        nearbyUsers.push({
          id: userId,
          name: user.name || 'Unknown User',
          photoURL: user.photoURL || '',
          lastSeen: lastSeen || new Date(0),
          distance,
          isOnline,
          isSameNetwork: isSameNetwork || false,
        });
      }
    });

    // Sort exactly like Flutter SQL: ORDER BY "sameWiFi" DESC, distance ASC
    const sortedUsers = nearbyUsers.sort((a, b) => {
      // Primary sort: same network users first (sameWiFi DESC)
      if (a.isSameNetwork && !b.isSameNetwork) return -1;
      if (!a.isSameNetwork && b.isSameNetwork) return 1;

      // Secondary sort: by distance ASC (closer users first)
      return a.distance - b.distance;
    });

    return sortedUsers;

  } catch (error) {
    console.error('Error loading nearby users:', error);
    return [];
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

// Function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);  // deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180)
}