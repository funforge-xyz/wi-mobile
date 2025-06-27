
import { getFirestore } from '../services/firebase';
import { getAuth } from '../services/firebase';
import { collection, getDocs, doc, getDoc, query, orderBy, limit, where, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
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

// Helper function to calculate bounding box for radius
const calculateBoundingBox = (latitude: number, longitude: number, radiusKm: number) => {
  const latDelta = radiusKm / 111.32; // 1 degree lat ≈ 111.32 km
  const lonDelta = radiusKm / (111.32 * Math.cos(latitude * Math.PI / 180));
  
  return {
    minLat: latitude - latDelta,
    maxLat: latitude + latDelta,
    minLon: longitude - lonDelta,
    maxLon: longitude + lonDelta
  };
};

export const loadConnectionPosts = async (
  userRadius: number | null,
  currentUserLocation: any,
  lastTimestamp: Date | null = null,
  limitCount: number = 50
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

    // Calculate bounding box if location filtering is needed
    let boundingBox = null;
    if (userRadius && currentUserLocation) {
      boundingBox = calculateBoundingBox(
        currentUserLocation.latitude,
        currentUserLocation.longitude,
        userRadius
      );
    }

    // Get eligible users first (those not current user, public posts, and within radius if applicable)
    let usersQuery = query(
      collection(firestore, 'users'),
      where('__name__', '!=', currentUser.uid) // Exclude current user
    );

    // Add location bounds to users query if radius filtering is needed
    if (boundingBox) {
      usersQuery = query(
        collection(firestore, 'users'),
        where('__name__', '!=', currentUser.uid),
        where('location.latitude', '>=', boundingBox.minLat),
        where('location.latitude', '<=', boundingBox.maxLat)
      );
    }

    const usersSnapshot = await getDocs(usersQuery);
    console.log('Users fetched:', usersSnapshot.size);

    // Filter eligible users by longitude bounds and radius if needed
    const eligibleUsers = new Map<string, any>();
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const userLat = userData.location?.latitude;
      const userLon = userData.location?.longitude;

      // Skip users without location
      if (!userLat || !userLon) return;

      // Apply longitude bounds if location filtering is active
      if (boundingBox) {
        if (userLon < boundingBox.minLon || userLon > boundingBox.maxLon) return;

        // Apply precise radius check
        const distance = calculateDistance(
          currentUserLocation.latitude,
          currentUserLocation.longitude,
          userLat,
          userLon
        );
        if (distance > userRadius) return;
      }

      eligibleUsers.set(userDoc.id, userData);
    });

    console.log('Eligible users after location filtering:', eligibleUsers.size);

    if (eligibleUsers.size === 0) {
      return [];
    }

    // Get posts from eligible users
    const eligibleUserIds = Array.from(eligibleUsers.keys());
    
    // Build posts query
    let postsQuery;
    const baseConstraints = [
      where('authorId', 'in', eligibleUserIds.slice(0, 10)), // Firestore 'in' limit is 10
      where('isPrivate', '!=', true),
      orderBy('createdAt', 'desc')
    ];

    if (lastTimestamp) {
      baseConstraints.push(where('createdAt', '<', lastTimestamp));
    }

    baseConstraints.push(limit(limitCount));

    postsQuery = query(collection(firestore, 'posts'), ...baseConstraints);

    // If we have more than 10 eligible users, we need multiple queries
    const allPosts: any[] = [];
    const batchSize = 10;
    
    for (let i = 0; i < eligibleUserIds.length; i += batchSize) {
      const batch = eligibleUserIds.slice(i, i + batchSize);
      
      const batchConstraints = [
        where('authorId', 'in', batch),
        where('isPrivate', '!=', true),
        orderBy('createdAt', 'desc')
      ];

      if (lastTimestamp) {
        batchConstraints.push(where('createdAt', '<', lastTimestamp));
      }

      batchConstraints.push(limit(limitCount));

      const batchQuery = query(collection(firestore, 'posts'), ...batchConstraints);
      const batchSnapshot = await getDocs(batchQuery);
      
      batchSnapshot.forEach(doc => {
        allPosts.push({ id: doc.id, ...doc.data() });
      });
    }

    // Sort all posts by creation date and take only what we need
    allPosts.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
    const limitedPosts = allPosts.slice(0, limitCount);

    console.log('Posts fetched after user filtering:', limitedPosts.length);

    const connectionPosts: any[] = [];

    for (const postData of limitedPosts) {
      const authorId = postData.authorId;
      const authorData = eligibleUsers.get(authorId);

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
