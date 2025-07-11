import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  doc,
  getDoc,
  startAfter,
  Timestamp,
  getFirestore,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface ConnectionPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  mediaURL?: string;
  mediaType?: 'image' | 'video';
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
  showLikeCount: boolean;
  allowComments: boolean;
  isLikedByUser: boolean;
  isAuthorOnline: boolean;
  isFromConnection: boolean;
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

export const updateUserLastSeen = async () => {
  // This function has been removed - no longer tracking online status
  return;
};

export const loadConnectionPosts = async (
  userRadius: number,
  currentUserLocation: any,
  lastTimestamp: Date | null = null,
  limit: number = 10
): Promise<ConnectionPost[]> => {
  const maxRetries = 3; // Define the maximum number of retries
  let retryCount = 0;

  return new Promise(async (resolve, reject) => {
    while (retryCount < maxRetries) {
      try {
    const { getAuth, getFirestore } = await import('../services/firebase');
    const { 
      collection, 
      query, 
      where, 
      orderBy, 
      limit: firestoreLimit, 
      getDocs,
      startAfter,
      doc: docRef,
      getDoc
    } = await import('firebase/firestore');

    const auth = getAuth();
    const firestore = getFirestore();
    const currentUser = auth.currentUser;

    // Double-check authentication
    if (!currentUser) {
      console.warn('No current user found in loadConnectionPosts - user may have logged out');
      return [];
    }

    const authService = {
        isAuthenticated: async () => {
            return !!currentUser
        }
    }

    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) {
      console.error('Auth service reports user not authenticated in loadConnectionPosts');
      return [];
    }

    const userDocRef = docRef(firestore, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();

    if (!userData) {
      throw new Error('User data not found');
    }

    const userLocation = userData.location || currentUserLocation;
    const currentUserRadius = userData.trackingRadius ? userData.trackingRadius / 1000 : userRadius || 0.1; // Default 100m
    const sameNetworkMatchingEnabled = userData.sameNetworkMatching ?? true;
    const currentUserNetworkId = userData.currentNetworkId;

    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      return [];
    }

    // Get blocked users, connections, and all users in parallel
    const [blockedByMeQuery, blockedMeQuery, connectionsQuery, usersQuery] = await Promise.all([
      getDocs(query(
        collection(firestore, 'blockedUsers'),
        where('blockedBy', '==', currentUser.uid)
      )),
      getDocs(query(
        collection(firestore, 'blockedUsers'),
        where('blockedUser', '==', currentUser.uid)
      )),
      getDocs(query(
        collection(firestore, 'connections'),
        where('participants', 'array-contains', currentUser.uid)
      )),
      getDocs(collection(firestore, 'users'))
    ]);

    // Combine both directions of blocking
    const blockedUserIds = new Set([
      ...blockedByMeQuery.docs.map(doc => doc.data().blockedUser), // Users I blocked
      ...blockedMeQuery.docs.map(doc => doc.data().blockedBy) // Users who blocked me
    ]);

    const connectedUserIds = new Set(
      connectionsQuery.docs.flatMap(doc => 
        doc.data().participants.filter((id: string) => id !== currentUser.uid)
      )
    );

    // Calculate bounding box for location-based filtering
    const latDelta = currentUserRadius / 111.32; // 1 degree lat ≈ 111.32 km
    const lonDelta = currentUserRadius / (111.32 * Math.cos(userLocation.latitude * Math.PI / 180));

    const minLat = userLocation.latitude - latDelta;
    const maxLat = userLocation.latitude + latDelta;
    const minLon = userLocation.longitude - lonDelta;
    const maxLon = userLocation.longitude + lonDelta;

    const eligibleUsers = new Map();
    const now = new Date();
    const onlineThreshold = 2 * 60 * 1000; // 2 minutes

    usersQuery.docs.forEach(userDocSnap => {
      const userId = userDocSnap.id;
      const user = userDocSnap.data();

      // Skip current user and blocked users (but INCLUDE connected users for feed)
      if (userId === currentUser.uid || blockedUserIds.has(userId)) {
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

      // Check if user is a connection
      const isConnection = connectedUserIds.has(userId);

      let shouldInclude = false;
      let distance = 0;

      if (isSameNetwork) {
        // Always include same network users (highest priority)
        shouldInclude = true;
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          user.location.latitude,
          user.location.longitude
        );
      } else {
        // For non-same-network users, check distance and longitude bounds
        if (user.location.longitude >= minLon && user.location.longitude <= maxLon &&
            user.location.latitude >= minLat && user.location.latitude <= maxLat) {
          // Calculate precise distance using Haversine formula
          distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            user.location.latitude,
            user.location.longitude
          );

          // Get user's radius preference, use smaller of the two or default
          const userRadius = user.trackingRadius ? user.trackingRadius / 1000 : 0.1;
          const effectiveRadius = Math.min(currentUserRadius, userRadius);

          shouldInclude = distance <= effectiveRadius;
        }
      }

      // Note: Connection status (isConnection) is now only used for display purposes
      // Connections are not automatically included unless they're also in proximity

      if (shouldInclude) {
        eligibleUsers.set(userId, {
          ...user,
          id: userId,
          // isOnline,
          distance,
          isSameNetwork: isSameNetwork || false,
          isConnection
        });
      }
    });

    if (eligibleUsers.size === 0) {
      return [];
    }

    // Sort eligible users exactly like NearbyScreen: sameWiFi DESC, distance ASC
    const sortedUserIds = Array.from(eligibleUsers.keys()).sort((a, b) => {
      const userA = eligibleUsers.get(a);
      const userB = eligibleUsers.get(b);

      // Primary sort: sameWiFi DESC (same network users first)
      if (userA.isSameNetwork && !userB.isSameNetwork) return -1;
      if (!userA.isSameNetwork && userB.isSameNetwork) return 1;

            // Secondary sort: distance ASC (closer users first)
      return (userA.distance || 0) - (userB.distance || 0);
    });

    // Get posts from eligible users (removed 7-day filter)
    const posts: ConnectionPost[] = [];
    const postsPerUser = Math.ceil(limit / Math.min(sortedUserIds.length, 10)); // Distribute pageSize among users

    // Get current user's likes to check if posts are liked
    const currentUserLikesQuery = query(
      collection(firestore, 'likes'),
      where('userId', '==', currentUser.uid)
    );
    const likesSnapshot = await getDocs(currentUserLikesQuery);
    const likedPostIds = new Set(likesSnapshot.docs.map(doc => doc.data().postId));

    for (const userId of sortedUserIds) {
      if (posts.length >= limit) break;

      const userInfo = eligibleUsers.get(userId);

      // Build posts query for this user
      let postsQuery = query(
        collection(firestore, 'posts'),
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(postsPerUser)
      );

      // Add pagination if needed
      if (lastTimestamp) {
        postsQuery = query(
          collection(firestore, 'posts'),
          where('authorId', '==', userId),
          where('createdAt', '<', Timestamp.fromDate(lastTimestamp)),
          orderBy('createdAt', 'desc'),
          firestoreLimit(postsPerUser)
        );
      }

      const userPostsSnapshot = await getDocs(postsQuery);

      for (const postDoc of userPostsSnapshot.docs) {
        if (posts.length >= limit) break;

        const postData = postDoc.data();
        const postId = postDoc.id;

        console.log('feedUtils - Firebase post data:', {
          id: postId,
          isFrontCamera: postData.isFrontCamera,
          mediaType: postData.mediaType,
          hasMediaURL: !!postData.mediaURL,
          firebaseLikesCount: postData.likesCount || 0,
          firebaseCommentsCount: postData.commentsCount || 0
        });

        posts.push({
          id: postId,
          authorId: userId,
          authorName: userInfo.firstName && userInfo.lastName ? 
            `${userInfo.firstName} ${userInfo.lastName}` : 'Anonymous User',
          authorPhotoURL: userInfo.photoURL || '',
          content: postData.content || '',
          mediaURL: postData.mediaURL,
          mediaType: postData.mediaType,
          isFrontCamera: postData.isFrontCamera,
          createdAt: postData.createdAt?.toDate() || new Date(),
          likesCount: postData.likesCount || 0,
          commentsCount: postData.commentsCount || 0,
          showLikeCount: postData.showLikeCount ?? true,
          allowComments: postData.allowComments ?? true,
          isLikedByUser: likedPostIds.has(postId),
          isAuthorOnline: userInfo.isOnline,
          isFromConnection: userInfo.isConnection
        });
      }
    }

    // Sort all posts by creation date (newest first)
    const connectionPosts = posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          resolve(connectionPosts);
          break; // If successful, break the retry loop
        } catch (error) {
          console.error('Error loading connection posts:', error);
          retryCount++;
          console.log(`Attempt ${retryCount} failed. Retrying...`);

          if (retryCount === maxRetries) {
            console.error('Max retries reached. Rejecting promise.');
            reject(error);
          }

          // Implement a delay before retrying, e.g., exponential backoff
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
        }
      }
    }
  );
};

export const loadUserSettings = async (): Promise<number | null> => {
  try {
    const { settingsService } = await import('../services/settings');
    const { authService } = await import('../services/auth');

    let savedRadiusInMeters = await settingsService.getTrackingRadius();

    // Try to get from Firebase if available
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser || await authService.getCurrentUser();

      if (currentUser) {
        const firestore = getFirestore();
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().trackingRadius) {
          savedRadiusInMeters = userDoc.data().trackingRadius;
        }
      }
    } catch (error) {
      console.log('Could not load radius from Firebase, using local storage');
    }

    // Convert meters to kilometers, default to 100 meters (0.1km) if not set
    const radiusInKm = savedRadiusInMeters ? savedRadiusInMeters / 1000 : 0.1;
    return radiusInKm;
  } catch (error) {
    console.error('Error loading user settings:', error);
    return 0.1; // Default to 100 meters
  }
};

export const handleLikePost = async (
  postId: string, 
  liked: boolean, 
  posts: ConnectionPost[]
): Promise<{ liked: boolean } | null> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const firestore = getFirestore();

    if (liked) {
      // Add like
      const { addDoc } = await import('firebase/firestore');
      await addDoc(collection(firestore, 'likes'), {
        postId,
        userId: currentUser.uid,
        createdAt: new Date()
      });
    } else {
      // Remove like
      const likesQuery = query(
        collection(firestore, 'likes'),
        where('postId', '==', postId),
        where('userId', '==', currentUser.uid)
      );
      const likesSnapshot = await getDocs(likesQuery);

      const { deleteDoc } = await import('firebase/firestore');
      const deletePromises = likesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    }

    return { liked };

  } catch (error) {
    console.error('Error handling post like:', error);
    return null;
  }
};

export const handlePostLike = async (
  postId: string,
  newLikedState: boolean,
  currentUser: any
): Promise<void> => {
  try {
    const firestore = getFirestore();
    const { addDoc, deleteDoc, collection, query, where, getDocs, doc, updateDoc, increment } = await import('firebase/firestore');

    const postRef = doc(firestore, 'posts', postId);
    const likesCollectionRef = collection(firestore, 'posts', postId, 'likes');

    if (newLikedState) {
      // Like: add a like document and update post likesCount
      await addDoc(likesCollectionRef, {
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        createdAt: new Date(),
      });
      await updateDoc(postRef, {
        likesCount: increment(1)
      });
      console.log('feedUtils - Successfully added like to Firebase');
    } else {
      // Unlike: remove the like document and update post likesCount
      const userLikeQuery = query(likesCollectionRef, where('authorId', '==', currentUser.uid));
      const userLikeSnapshot = await getDocs(userLikeQuery);

      if (!userLikeSnapshot.empty) {
        const likeDoc = userLikeSnapshot.docs[0];
        await deleteDoc(likeDoc.ref);
        await updateDoc(postRef, {
          likesCount: increment(-1)
        });
        console.log('feedUtils - Successfully removed like from Firebase');
      } else {
        console.log('feedUtils - No like document found to remove');
      }
    }
  } catch (error) {
    console.error('feedUtils - Error handling like:', error);
    throw error;
  }
};
import { DocumentSnapshot } from 'firebase/firestore';

export async function loadFeedPosts(
  limit: number = 10,
  lastDoc?: DocumentSnapshot,
  currentUserId?: string
): Promise<{ posts: any[]; hasMore: boolean }> {
  try {
    console.log('loadFeedPosts called with:', { limit, currentUserId });

    const firestore = getFirestore();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Get user settings
    const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
    const userData = userDoc.data();
    const userRadius = userData?.trackingRadius ? userData.trackingRadius / 1000 : 0.1; // Convert meters to km, default 100m
    const sameNetworkMatchingEnabled = userData?.sameNetworkMatchingEnabled || false;
    const currentUserNetworkId = userData?.currentNetworkId || null;
    const userLocation = userData?.location;

    if (!userLocation) {
      console.log('User location not available');
      return { posts: [], hasMore: false };
    }

    // Get blocked users (both directions)
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

    // Combine both directions of blocking
    const blockedUserIds = new Set([
      ...blockedByMeQuery.docs.map(doc => doc.data().blockedUser), // Users I blocked
      ...blockedMeQuery.docs.map(doc => doc.data().blockedBy) // Users who blocked me
    ]);

    // Get connected users
    const connectionsQuery = query(
      collection(firestore, 'connections'),
      where('participants', 'array-contains', currentUser.uid)
    );
    const connectionsSnapshot = await getDocs(connectionsQuery);
    const connectedUserIds = new Set<string>();

    connectionsSnapshot.docs.forEach(doc => {
      const participants = doc.data().participants;
      participants.forEach((id: string) => {
        if (id !== currentUser.uid) {
          connectedUserIds.add(id);
        }
      });
    });

    // Get all users for filtering
    const usersQuery = query(collection(firestore, 'users'));
    const usersSnapshot = await getDocs(usersQuery);

    // Calculate bounding box for location-based filtering
    const latDelta = userRadius / 111.32; // 1 degree lat ≈ 111.32 km
    const lonDelta = userRadius / (111.32 * Math.cos(userLocation.latitude * Math.PI / 180));

    const minLat = userLocation.latitude - latDelta;
    const maxLat = userLocation.latitude + latDelta;
    const minLon = userLocation.longitude - lonDelta;
    const maxLon = userLocation.longitude + lonDelta;

    const eligibleUsers = new Map();
    const now = new Date();
    const onlineThreshold = 2 * 60 * 1000; // 2 minutes

    usersSnapshot.docs.forEach(userDocSnap => {
      const userId = userDocSnap.id;
      const user = userDocSnap.data();

      // Skip current user and blocked users (but INCLUDE connected users for feed)
      if (userId === currentUser.uid || blockedUserIds.has(userId)) {
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

      // Check if user is a connection
      const isConnection = connectedUserIds.has(userId);

      // For feed, we want to show posts from:
      // 1. Users within radius OR on same network (if enabled)
      // 2. Connection status is secondary - connections must still be in range
      let shouldInclude = false;

      // Check if user is on same network (highest priority)
      if (sameNetworkMatchingEnabled && isSameNetwork) {
        shouldInclude = true;
      } else {
        // Check location bounds and distance
        const withinBounds = user.location.latitude >= minLat && 
                            user.location.latitude <= maxLat &&
                            user.location.longitude >= minLon && 
                            user.location.longitude <= maxLon;

        if (withinBounds) {
          // Calculate precise distance
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            user.location.latitude,
            user.location.longitude
          );

          if (distance <= userRadius) {
            shouldInclude = true;
          }
        }
      }

      // Note: Connection status (isConnection) is now only used for display purposes
      // Connections are not automatically included unless they're also in proximity

      if (shouldInclude) {
        eligibleUsers.set(userId, {
          ...user,
          id: userId,
          // isOnline,
          isSameNetwork,
          isConnection
        });
      }
    });

    if (eligibleUsers.size === 0) {
      return { posts: [], hasMore: false };
    }

    // Get posts from eligible users
    const eligibleUserIds = Array.from(eligibleUsers.keys());

    // Handle Firestore 'in' query limit of 10 by batching
    const allPosts: any[] = [];
    const batchSize = 10;

    for (let i = 0; i < eligibleUserIds.length; i += batchSize) {
      const batch = eligibleUserIds.slice(i, i + batchSize);

      let postsQuery = query(
        collection(firestore, 'posts'),
        where('authorId', 'in', batch),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );

      if (lastDoc) {
        postsQuery = query(
          collection(firestore, 'posts'),
          where('authorId', 'in', batch),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          firestoreLimit(limit)
        );
      }

      const postsSnapshot = await getDocs(postsQuery);

      for (const postDoc of postsSnapshot.docs) {
        const post = postDoc.data();
        const authorData = eligibleUsers.get(post.authorId);

        if (!authorData) continue;

        // Check if current user has liked this post
        const likeQuery = query(
          collection(firestore, 'posts', postDoc.id, 'likes'),
          where('authorId', '==', currentUser.uid)
        );
        const likeSnapshot = await getDocs(likeQuery);
        const isLikedByUser = !likeSnapshot.empty;

        allPosts.push({
          id: postDoc.id,
          ...post,
          authorName: `${authorData.firstName} ${authorData.lastName}`,
          authorPhotoURL: authorData.photoURL || '',
          createdAt: post.createdAt.toDate(),
          isLikedByUser,
          isAuthorOnline: authorData.isOnline,
          isFromConnection: connectedUserIds.has(post.authorId)
        });
      }
    }

    // Sort all posts by creation date and limit
    allPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const limitedPosts = allPosts.slice(0, limit);

    console.log('loadFeedPosts - Posts loaded:', limitedPosts.length);
    console.log('loadFeedPosts - Eligible users:', eligibleUsers.size);

    return { 
      posts: limitedPosts, 
      hasMore: allPosts.length === limit 
    };

  } catch (error) {
    console.error('Error loading feed posts:', error);
    throw error;
  }
}