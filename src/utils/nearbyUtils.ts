import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc, 
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { 
  getFirestore, 
  GeoPoint, 
  Timestamp 
} from 'firebase/firestore';
import { getNetworkStateAsync } from 'expo-network';
import { AppDispatch } from '../store';
import { 
  setLoading, 
  setRefreshing, 
  setLoadingMore, 
  setUsers, 
  appendUsers, 
  setLastDoc, 
  setHasMore, 
  setError 
} from '../store/nearbySlice';

export interface NearbyUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio: string;
  // isOnline: boolean;
  distance?: number;
  isSameNetwork: boolean;
}

// Function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

export const loadNearbyUsersWithRedux = async (
  currentUserId: string,
  dispatch: AppDispatch,
  lastDoc: QueryDocumentSnapshot | null = null,
  pageSize: number = 50,
  isRefresh: boolean = false,
  isLoadMore: boolean = false
): Promise<void> => {
  try {
    if (isRefresh) {
      dispatch(setRefreshing(true));
    } else if (isLoadMore) {
      dispatch(setLoadingMore(true));
    } else {
      dispatch(setLoading(true));
    }

    dispatch(setError(null));

    const result = await loadNearbyUsers(currentUserId, lastDoc, pageSize);

    if (isRefresh || (!isLoadMore && !lastDoc)) {
      dispatch(setUsers(result.users));
    } else {
      dispatch(appendUsers(result.users));
    }

    dispatch(setLastDoc(result.lastDoc));
    dispatch(setHasMore(result.hasMore));

  } catch (error) {
    console.error('Error loading nearby users:', error);
    dispatch(setError('Failed to load nearby users'));
  } finally {
    dispatch(setLoading(false));
    dispatch(setRefreshing(false));
    dispatch(setLoadingMore(false));
  }
};

export const loadNearbyUsers = async (
  currentUserId: string,
  lastDoc: QueryDocumentSnapshot | null = null,
  pageSize: number = 50,
  page: number = 0
): Promise<{ users: NearbyUser[], lastDoc: QueryDocumentSnapshot | null, hasMore: boolean }> => {
  try {
    const firebase = await import('../services/firebase');
    const firestore = firebase.getFirestore();
    const auth = firebase.getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Get current user's data including location and settings
    const userDocRef = doc(firestore, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef, { source: 'server' });
    const userData = userDoc.data();

    if (!userData) {
      throw new Error('User data not found');
    }

    const currentUserLocation = userData.location;
    const currentUserRadius = userData.trackingRadius ? userData.trackingRadius / 1000 : 0.1; // Convert meters to km, default 100m
    const sameNetworkMatchingEnabled = userData.sameNetworkMatching ?? true;
    const currentUserNetworkId = userData.currentNetworkId;

    if (!currentUserLocation || !currentUserLocation.latitude || !currentUserLocation.longitude) {
      return { users: [], lastDoc: null, hasMore: false };
    }

    // Get blocked users - force server data
    const [blockedByMeQuery, blockedMeQuery] = await Promise.all([
      getDocs(query(
        collection(firestore, 'blockedUsers'),
        where('blockedBy', '==', currentUser.uid)
      ), { source: 'server' }),
      getDocs(query(
        collection(firestore, 'blockedUsers'),
        where('blockedUser', '==', currentUser.uid)
      ), { source: 'server' })
    ]);

    // Combine both directions of blocking
    const blockedUserIds = new Set([
      ...blockedByMeQuery.docs.map(doc => doc.data().blockedUser), // Users I blocked
      ...blockedMeQuery.docs.map(doc => doc.data().blockedBy) // Users who blocked me
    ]);

    // Calculate bounding box for location-based filtering
    const latDelta = currentUserRadius / 111.32; // 1 degree lat ≈ 111.32 km
    const lonDelta = currentUserRadius / (111.32 * Math.cos(currentUserLocation.latitude * Math.PI / 180));

    const minLat = currentUserLocation.latitude - latDelta;
    const maxLat = currentUserLocation.latitude + latDelta;
    const minLon = currentUserLocation.longitude - lonDelta;
    const maxLon = currentUserLocation.longitude + lonDelta;

    // Build the base query with increased limit for filtering
    const fetchLimit = Math.max(pageSize * 3, 150); // Ensure we get enough data to filter
    let usersQuery = query(
      collection(firestore, 'users'),
      where('location.latitude', '>=', minLat),
      where('location.latitude', '<=', maxLat),
      orderBy('location.latitude'),
      limit(fetchLimit)
    );

    const usersSnapshot = await getDocs(usersQuery, { source: 'server' });
    const nearbyUsers: NearbyUser[] = [];
    // const now = new Date();
    // const onlineThreshold = 2 * 60 * 1000; // 2 minutes

    usersSnapshot.docs.forEach(userDocSnap => {
      const userId = userDocSnap.id;
      const user = userDocSnap.data();

      // Skip current user and blocked users only
      if (userId === currentUser.uid || 
          blockedUserIds.has(userId)) {
        return;
      }

      // Check if user has valid location
      if (!user.location || !user.location.latitude || !user.location.longitude) {
        return;
      }

      // const lastSeen = user.lastSeen?.toDate();
      // const isOnline = lastSeen && (now.getTime() - lastSeen.getTime()) < onlineThreshold;

      // Check if user is on same network
      const isSameNetwork = sameNetworkMatchingEnabled && 
                           currentUserNetworkId && 
                           user.currentNetworkId === currentUserNetworkId;

      let shouldInclude = false;
      let distance = 0;

      if (isSameNetwork) {
        // Always include same network users
        shouldInclude = true;
        distance = calculateDistance(
          currentUserLocation.latitude,
          currentUserLocation.longitude,
          user.location.latitude,
          user.location.longitude
        );
      } else {
        // For non-same-network users, check distance and longitude bounds
        if (user.location.longitude >= minLon && user.location.longitude <= maxLon) {
          // Calculate precise distance using Haversine formula
          distance = calculateDistance(
            currentUserLocation.latitude,
            currentUserLocation.longitude,
            user.location.latitude,
            user.location.longitude
          );

          // Get user's radius preference, use smaller of the two or default
          const userRadius = user.trackingRadius ? user.trackingRadius / 1000 : 0.1; // Convert meters to km, default 100m
          const effectiveRadius = Math.min(currentUserRadius, userRadius);

          shouldInclude = distance <= effectiveRadius;
        }
      }

      if (shouldInclude) {
        nearbyUsers.push({
          id: userId,
          firstName: user.firstName || 'Unknown',
          lastName: user.lastName || 'User',
          email: user.email || '',
          photoURL: user.photoURL || '',
          bio: user.bio || '',
          // isOnline,
          distance,
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
      return (a.distance || 0) - (b.distance || 0);
    });

    // Apply pagination based on page number
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = sortedUsers.slice(startIndex, endIndex);
    const hasMore = sortedUsers.length > endIndex;

    return {
      users: paginatedUsers,
      lastDoc: null, // Not needed for page-based pagination
      hasMore
    };

  } catch (error) {
    console.error('Error loading nearby users:', error);
    return { users: [], lastDoc: null, hasMore: false };
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
    // const firestore = getFirestore();

    // // Check if there's already a connection or request between users
    // const existingConnectionQuery = query(
    //   collection(firestore, 'connections'),
    //   where('participants', 'array-contains', currentUserId)
    // );
    // const connectionsSnapshot = await getDocs(existingConnectionQuery);

    // let hasConnection = false;
    // connectionsSnapshot.forEach((doc) => {
    //   const connectionData = doc.data();
    //   if (connectionData.participants.includes(user.id) && connectionData.status === 'active') {
    //     hasConnection = true;
    //   }
    // });

    // // Check for existing requests
    // const existingRequestQuery = query(
    //   collection(firestore, 'connectionRequests'),
    //   where('fromUserId', '==', currentUserId),
    //   where('toUserId', '==', user.id),
    //   where('status', '==', 'pending')
    // );
    // const requestSnapshot = await getDocs(existingRequestQuery);

    // let hasRequest = false;
    // if (!requestSnapshot.empty) {
    //   hasRequest = true;
    // }

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