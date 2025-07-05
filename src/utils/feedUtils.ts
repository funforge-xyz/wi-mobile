import { getFirestore } from '../services/firebase';
import { getAuth } from '../services/firebase';
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Simple distance calculation using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const updateUserLastSeen = async () => {
  try {
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

export const loadUserSettings = async () => {
  try {
    // Load user's radius setting
    const savedRadius = await AsyncStorage.getItem('userLocationRadius');
    return savedRadius ? parseFloat(savedRadius) : null;
  } catch (error) {
    console.error('Error loading user settings:', error);
    return null;
  }
};

export const handleLikePost = async (postId: string, liked: boolean, posts: any[]) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.log('No current user found');
    return null;
  }

  const firestore = getFirestore();
  const likeRef = doc(firestore, 'posts', postId, 'likes', currentUser.uid);

  try {
    if (liked) {
      await deleteDoc(likeRef);
      console.log("Post unliked");
    } else {
      await setDoc(likeRef, {
        authorId: currentUser.uid,
        createdAt: new Date(),
      });
      console.log("Post liked");

      // Create notification for the post author
      const post = posts.find(p => p.id === postId);
      if (post && post.authorId !== currentUser.uid) {
        // Get current user info
        const currentUserDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
        const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : {};
        const currentUserName = currentUserData.firstName && currentUserData.lastName 
          ? `${currentUserData.firstName} ${currentUserData.lastName}` 
          : 'Someone';

        // Create notification
        await addDoc(collection(firestore, 'notifications'), {
          type: 'like',
          title: 'New Like',
          body: `${currentUserName} liked your post`,
          postId: postId,
          targetUserId: post.authorId,
          fromUserId: currentUser.uid,
          fromUserName: currentUserName,
          fromUserPhotoURL: currentUserData.photoURL || '',
          createdAt: new Date(),
          read: false,
        });
      }
    }

    return {
      success: true,
      liked: !liked,
    };
  } catch (error) {
    console.error("Error liking/unliking post:", error);
    Alert.alert("Error", "Failed to like/unlike post");
    return null;
  }
};

const getNearbyUsers = async (
  currentUserLocation: { latitude: number; longitude: number },
  radiusKm: number,
  currentUserId: string
): Promise<string[]> => {
  try {
    const firestore = getFirestore();

    // Calculate bounding box for the radius
    const latDelta = radiusKm / 111.32; // 1 degree lat ≈ 111.32 km
    const lonDelta = radiusKm / (111.32 * Math.cos(currentUserLocation.latitude * Math.PI / 180));

    const bounds = {
      minLat: currentUserLocation.latitude - latDelta,
      maxLat: currentUserLocation.latitude + latDelta,
      minLon: currentUserLocation.longitude - lonDelta,
      maxLon: currentUserLocation.longitude + lonDelta
    };

    // Query users within bounding box
    const usersQuery = query(
      collection(firestore, 'users'),
      where('location.latitude', '>=', bounds.minLat),
      where('location.latitude', '<=', bounds.maxLat),
      where('__name__', '!=', currentUserId)
    );

    const usersSnapshot = await getDocs(usersQuery);
    const nearbyUserIds: string[] = [];

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const userLat = userData.location?.latitude;
      const userLon = userData.location?.longitude;

      if (userLat && userLon) {
        // Apply longitude bounds check
        if (userLon >= bounds.minLon && userLon <= bounds.maxLon) {
          // Apply precise radius check using Haversine formula
          const distance = calculateDistance(
            currentUserLocation.latitude,
            currentUserLocation.longitude,
            userLat,
            userLon
          );

          if (distance <= radiusKm) {
            nearbyUserIds.push(userDoc.id);
          }
        }
      }
    });

    console.log(`Found ${nearbyUserIds.length} nearby users within ${radiusKm}km`);
    return nearbyUserIds;
  } catch (error) {
    console.error('Error in nearby users query:', error);
    return [];
  }
};

// Helper function to get posts in batches
const getPostsInBatches = async (userIds: string[], lastTimestamp?: any, pageSize: number = 10) => {
  if (userIds.length === 0) {
    return { posts: [], hasMore: false, lastTimestamp: null };
  }

  const firestore = getFirestore();
  const batchSize = 10; // Firestore 'in' query limit
  const allPosts: any[] = [];

  // Process user IDs in batches of 10
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);

    let postsQuery = query(
      collection(firestore, 'posts'),
      where('authorId', 'in', batch),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    if (lastTimestamp) {
      postsQuery = query(
        collection(firestore, 'posts'),
        where('authorId', 'in', batch),
        orderBy('createdAt', 'desc'),
        startAfter(lastTimestamp),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(postsQuery);
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    allPosts.push(...posts);
  }

  // Sort all posts by timestamp
  allPosts.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

  // Take only the requested page size
  const paginatedPosts = allPosts.slice(0, pageSize);
  const hasMore = allPosts.length >= pageSize;
  const newLastTimestamp = paginatedPosts.length > 0 ? paginatedPosts[paginatedPosts.length - 1].createdAt : null;

  return {
    posts: paginatedPosts,
    hasMore,
    lastTimestamp: newLastTimestamp
  };
};

export const getFeedPosts = async (
  userRadius: number = 5,
  currentUserLocation: { latitude: number; longitude: number } | null,
  lastTimestamp?: any,
  pageSize: number = 10
) => {
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

    // Create user lookup map with network info and online status
    const users = new Map();
    const now = new Date();
    const onlineThreshold = 2 * 60 * 1000; // 2 minutes

    usersQuery.docs.forEach(doc => {
      const userData = doc.data();
      const lastSeen = userData.lastSeen?.toDate();
      const isOnline = lastSeen && (now.getTime() - lastSeen.getTime()) < onlineThreshold;

      users.set(doc.id, {
        ...userData,
        isOnline,
        isSameNetwork: sameNetworkMatchingEnabled && 
                      currentUserNetworkId && 
                      userData.currentNetworkId === currentUserNetworkId
      });
    });

    // Get connected users who are eligible (Flutter-style filtering)
    const eligibleUserIds = Array.from(connectedUserIds).filter(userId => {
      if (blockedUserIds.has(userId)) return false;

      const user = users.get(userId);
      if (!user) return false;

      // Flutter logic: Include if same network OR within distance
      if (sameNetworkMatchingEnabled && user.isSameNetwork) {
        return true;
      }

      // Check location-based criteria for non-same-network users
      if (!currentUserLocation || !user.location) return false;

      const distance = calculateDistance(
        currentUserLocation.latitude,
        currentUserLocation.longitude,
        user.location.latitude,
        user.location.longitude
      );

      return distance <= userRadius;
    });

    if (eligibleUserIds.length === 0) {
      return { posts: [], hasMore: false, lastTimestamp: null };
    }

    // Sort eligible users exactly like Flutter: sameWiFi DESC, distance ASC
    const sortedUserIds = eligibleUserIds.sort((a, b) => {
      const userA = users.get(a);
      const userB = users.get(b);

      // Primary sort: sameWiFi DESC (same network users first)
      if (userA.isSameNetwork && !userB.isSameNetwork) return -1;
      if (!userA.isSameNetwork && userB.isSameNetwork) return 1;

      // Secondary sort: distance ASC (closer users first)
      if (currentUserLocation && userA.location && userB.location) {
        const distanceA = calculateDistance(
          currentUserLocation.latitude,
          currentUserLocation.longitude,
          userA.location.latitude,
          userA.location.longitude
        );
        const distanceB = calculateDistance(
          currentUserLocation.latitude,
          currentUserLocation.longitude,
          userB.location.latitude,
          userB.location.longitude
        );
        return distanceA - distanceB;
      }

      return 0;
    });

    // Get posts from eligible users
    return await getPostsInBatches(sortedUserIds, lastTimestamp, pageSize);

  } catch (error) {
    console.error('Error loading feed posts:', error);
    return { posts: [], hasMore: false, lastTimestamp: null };
  }
};

import { setDoc, deleteDoc, addDoc } from 'firebase/firestore';