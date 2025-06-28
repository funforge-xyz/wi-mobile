
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
  userRadius: number | null,
  currentUserLocation: any,
  lastTimestamp: Date | null = null,
  limitCount: number = 10
) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log('No current user found');
      return [];
    }

    // Update user's lastSeen timestamp
    updateUserLastSeen();

    const firestore = getFirestore();
    const now = Date.now();

    // Default radius if not set
    const searchRadius = userRadius || 10; // Default 10km radius

    // Get current user location if not provided
    let userLocation = currentUserLocation;
    if (!userLocation) {
      const { locationService } = await import('../services/locationService');
      userLocation = await locationService.getCurrentLocation();
      
      if (!userLocation) {
        console.log('No user location available');
        return [];
      }
    }

    // Get all nearby users using GeoFirestore
    const nearbyUserIds = await getNearbyUsers(userLocation, searchRadius, currentUser.uid);
    
    if (nearbyUserIds.length === 0) {
      console.log('No nearby users found');
      return [];
    }

    // Get user's connections
    const connectionsQuery = query(
      collection(firestore, 'connections'),
      where('participants', 'array-contains', currentUser.uid),
      where('status', '==', 'active')
    );
    const connectionsSnapshot = await getDocs(connectionsQuery);

    // Extract connected user IDs
    const connectedUserIds = new Set<string>();
    connectionsSnapshot.forEach((doc) => {
      const connectionData = doc.data();
      const otherParticipant = connectionData.participants.find(
        (id: string) => id !== currentUser.uid
      );
      if (otherParticipant) {
        connectedUserIds.add(otherParticipant);
      }
    });

    // Fetch posts in batches of 10 users at a time
    const allPosts: any[] = [];
    const batchSize = 10; // Firestore 'in' query limit
    let totalFetched = 0;

    for (let i = 0; i < nearbyUserIds.length && totalFetched < limitCount; i += batchSize) {
      const batchPosts = await getPostsBatch(nearbyUserIds, i, lastTimestamp);
      allPosts.push(...batchPosts);
      totalFetched += batchPosts.length;
      
      // Stop if we have enough posts
      if (totalFetched >= limitCount) {
        break;
      }
    }

    // Sort all posts by creation date and limit
    allPosts.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
    const limitedPosts = allPosts.slice(0, limitCount);

    console.log('Posts fetched after processing:', limitedPosts.length);

    // Get user data for all authors
    const authorIds = [...new Set(limitedPosts.map(post => post.authorId))];
    const usersData = new Map<string, any>();

    // Fetch user data in batches
    for (let i = 0; i < authorIds.length; i += batchSize) {
      const authorBatch = authorIds.slice(i, i + batchSize);
      const usersQuery = query(
        collection(firestore, 'users'),
        where('__name__', 'in', authorBatch)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      usersSnapshot.forEach(doc => {
        usersData.set(doc.id, doc.data());
      });
    }

    const connectionPosts: any[] = [];

    for (const postData of limitedPosts) {
      const authorId = postData.authorId;
      const authorData = usersData.get(authorId);

      if (!authorData) continue;

      // Get likes & comments in parallel
      const [likesSnapshot, commentsSnapshot] = await Promise.all([
        getDocs(collection(firestore, 'posts', postData.id, 'likes')),
        getDocs(collection(firestore, 'posts', postData.id, 'comments')),
      ]);

      const isLikedByUser = likesSnapshot.docs.some(
        (likeDoc) => likeDoc.data().authorId === currentUser.uid
      );

      // Online status
      const isOnline =
        authorData.lastSeen?.toDate &&
        now - authorData.lastSeen.toDate().getTime() < 2 * 60 * 1000;

      connectionPosts.push({
        id: postData.id,
        authorId,
        authorName:
          authorData.firstName && authorData.lastName
            ? `${authorData.firstName} ${authorData.lastName}`
            : 'Anonymous User',
        authorPhotoURL: authorData.thumbnailURL || authorData.photoURL || '',
        content: postData.content || '',
        mediaURL: postData.mediaURL || '',
        mediaType: postData.mediaType || 'image',
        createdAt: postData.createdAt?.toDate() || new Date(),
        likesCount: postData.likesCount ?? likesSnapshot.size,
        commentsCount: postData.commentsCount ?? commentsSnapshot.size,
        showLikeCount: postData.showLikeCount !== false,
        allowComments: postData.allowComments !== false,
        isLikedByUser,
        isAuthorOnline: Boolean(isOnline),
        isFromConnection: connectedUserIds.has(authorId),
      });
    }

    console.log('Final connection posts:', connectionPosts.length, 'requested limit:', limitCount);
    
    return connectionPosts;
  } catch (error: any) {
    console.error('Error loading connection posts:', error);
    if (error.code !== 'cancelled' && error.code !== 'timeout') {
      Alert.alert(
        'Error',
        'Failed to load posts. Please check your connection and try again.'
      );
    }
    return [];
  }
};
