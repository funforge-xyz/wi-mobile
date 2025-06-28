import { getFirestore } from '../services/firebase';
import { getAuth } from '../services/firebase';
import { collection, getDocs, doc, getDoc, query, orderBy, limit, where, setDoc, deleteDoc, addDoc, startAfter } from 'firebase/firestore';
import { GeoFirestore } from 'geofirestore';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
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

// Helper function to get nearby users using GeoFirestore
const getNearbyUsers = async (
  currentUserLocation: { latitude: number; longitude: number },
  radiusKm: number,
  currentUserId: string
): Promise<string[]> => {
  try {
    const firestore = getFirestore();
    const geofirestore = new GeoFirestore(firestore);
    const geocollection = geofirestore.collection('users');

    // Import GeoPoint from firebase/firestore
    const { GeoPoint } = await import('firebase/firestore');

    // Create the GeoQuery
    const geoQuery = geocollection.near({
      center: new GeoPoint(currentUserLocation.latitude, currentUserLocation.longitude),
      radius: radiusKm
    });

    // Execute the query
    const snapshot = await geoQuery.get();
    const nearbyUserIds: string[] = [];

    snapshot.docs.forEach((doc) => {
      const userId = doc.id;
      // Exclude current user
      if (userId !== currentUserId) {
        nearbyUserIds.push(userId);
      }
    });

    console.log(`Found ${nearbyUserIds.length} nearby users within ${radiusKm}km using GeoFirestore`);
    return nearbyUserIds;
  } catch (error) {
    console.error('Error fetching nearby users with GeoFirestore:', error);

    // Fallback to manual bounding box query if GeoFirestore fails
    console.log('Falling back to manual geospatial query...');
    return await getNearbyUsersFallback(currentUserLocation, radiusKm, currentUserId);
  }
};

// Fallback function using manual bounding box calculation
const getNearbyUsersFallback = async (
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

    console.log(`Fallback: Found ${nearbyUserIds.length} nearby users within ${radiusKm}km`);
    return nearbyUserIds;
  } catch (error) {
    console.error('Error in fallback nearby users query:', error);
    return [];
  }
};

// Helper function to get posts in batches of 10
const getPostsBatch = async (
  userIds: string[],
  batchStartIndex: number,
  lastTimestamp: Date | null = null
): Promise<any[]> => {
  try {
    const firestore = getFirestore();
    const batchSize = 10;
    const userBatch = userIds.slice(batchStartIndex, batchStartIndex + batchSize);

    if (userBatch.length === 0) {
      return [];
    }

    const queryConstraints = [
      where('authorId', 'in', userBatch),
      orderBy('createdAt', 'desc'),
      limit(10)
    ];

    // Add timestamp filter for pagination
    if (lastTimestamp) {
      queryConstraints.splice(-1, 0, startAfter(lastTimestamp)); // Insert before limit
    }

    const postsQuery = query(collection(firestore, 'posts'), ...queryConstraints);
    const postsSnapshot = await getDocs(postsQuery);

    const posts: any[] = [];
    postsSnapshot.forEach(doc => {
      const postData = doc.data();
      posts.push({ id: doc.id, ...postData });
    });

    const limitedPosts = posts;

    console.log(`Fetched ${limitedPosts.length} posts from batch starting at index ${batchStartIndex}`);
    return limitedPosts;
  } catch (error) {
    console.error('Error fetching posts batch:', error);
    return [];
  }
};

export const loadConnectionPosts = async (
  lastTimestamp: Date | null = null,
  limit: number = 10,
  userRadius: number,
  currentUserLocation: { latitude: number; longitude: number } | null
): Promise<{ posts: ConnectionPost[]; hasMore: boolean; lastTimestamp: Date | null }> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const firestore = getFirestore();

    // Get user settings for same network matching preference
    const userDocRef = doc(firestore, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    const sameNetworkMatchingEnabled = userData?.sameNetworkMatching ?? true;
    const currentUserNetworkId = userData?.currentNetworkId;

    // Get blocked users and existing connections in parallel
    const [blockedUsersQuery, connectionsQuery, usersQuery] = await Promise.all([
      getDocs(query(
        collection(firestore, 'blocks'),
        where('blockerId', '==', currentUser.uid)
      )),
      getDocs(query(
        collection(firestore, 'connections'),
        where('participants', 'array-contains', currentUser.uid),
        where('status', '==', 'accepted')
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
      if (!currentUserLocation || !user.coordinates) return false;

      const distance = calculateDistance(
        currentUserLocation.latitude,
        currentUserLocation.longitude,
        user.coordinates.latitude,
        user.coordinates.longitude
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
      if (currentUserLocation && userA.coordinates && userB.coordinates) {
        const distanceA = calculateDistance(
          currentUserLocation.latitude,
          currentUserLocation.longitude,
          userA.coordinates.latitude,
          userA.coordinates.longitude
        );
        const distanceB = calculateDistance(
          currentUserLocation.latitude,
          currentUserLocation.longitude,
          userB.coordinates.latitude,
          userB.coordinates.longitude
        );
        return distanceA - distanceB;
      }

      return 0;
    });

    // Handle Firestore 'in' query limitation by batching
    const batchSize = 10;
    const allPosts: ConnectionPost[] = [];
    let totalFetched = 0;

    for (let i = 0; i < sortedUserIds.length && totalFetched < limit; i += batchSize) {
      const batch = sortedUserIds.slice(i, i + batchSize);

      let postsQuery = query(
        collection(firestore, 'posts'),
        where('authorId', 'in', batch),
        orderBy('createdAt', 'desc'),
        limit(limit - totalFetched)
      );

      if (lastTimestamp) {
        postsQuery = query(
          collection(firestore, 'posts'),
          where('authorId', 'in', batch),
          orderBy('createdAt', 'desc'),
          startAfter(lastTimestamp),
          limit(limit - totalFetched)
        );
      }

      const postsSnapshot = await getDocs(postsQuery);

      for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data();
        const author = users.get(postData.authorId);

        if (!author) continue;

        // Check if user liked this post
        const likeQuery = query(
          collection(firestore, 'likes'),
          where('postId', '==', postDoc.id),
          where('userId', '==', currentUser.uid)
        );
        const likeSnapshot = await getDocs(likeQuery);
        const isLikedByUser = !likeSnapshot.empty;

        allPosts.push({
          id: postDoc.id,
          authorId: postData.authorId,
          authorName: author.name || 'Unknown User',
          authorPhotoURL: author.photoURL || '',
          content: postData.content || '',
          mediaURL: postData.mediaURL,
          mediaType: postData.mediaType,
          createdAt: postData.createdAt.toDate(),
          likesCount: postData.likesCount || 0,
          commentsCount: postData.commentsCount || 0,
          showLikeCount: postData.showLikeCount ?? true,
          allowComments: postData.allowComments ?? true,
          isLikedByUser,
          isAuthorOnline: author.isOnline || false,
          isFromConnection: true,
        });
      }

      totalFetched = allPosts.length;
      if (postsSnapshot.docs.length < (limit - totalFetched)) {
        break; // No more posts in this batch
      }
    }

    // Apply Flutter-style sorting to final posts: network priority first, then time
    const sortedPosts = allPosts.sort((a, b) => {
      const authorA = users.get(a.authorId);
      const authorB = users.get(b.authorId);

      // Primary: Network priority (same network posts first)
      if (authorA.isSameNetwork && !authorB.isSameNetwork) return -1;
      if (!authorA.isSameNetwork && authorB.isSameNetwork) return 1;

      // Secondary: Creation time DESC (newest first within same network group)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const hasMore = allPosts.length === limit;
    const newLastTimestamp = sortedPosts.length > 0 
      ? sortedPosts[sortedPosts.length - 1].createdAt 
      : null;

    return { 
      posts: sortedPosts, 
      hasMore, 
      lastTimestamp: newLastTimestamp 
    };

  } catch (error) {
    console.error('Error loading connection posts:', error);
    return { posts: [], hasMore: false, lastTimestamp: null };
  }
};