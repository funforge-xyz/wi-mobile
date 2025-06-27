
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

    // Get posts with pagination
    let postsQuery;
    
    if (lastTimestamp) {
      console.log('Loading posts after timestamp:', lastTimestamp);
      postsQuery = query(
        collection(firestore, 'posts'),
        orderBy('createdAt', 'desc'),
        where('createdAt', '<', lastTimestamp),
        limit(limitCount * 3) // Get more posts to account for filtering
      );
    } else {
      console.log('Loading initial posts');
      postsQuery = query(
        collection(firestore, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(limitCount * 3) // Get more posts to account for filtering
      );
    }
    
    const postsSnapshot = await getDocs(postsQuery);

    console.log('Posts fetched:', postsSnapshot.size);

    // Filter posts first
    const filteredPosts = postsSnapshot.docs.filter((postDoc) => {
      const postData = postDoc.data();
      return (
        postData.authorId !== currentUser.uid &&
        postData.isPrivate !== true
      );
    });

    console.log('Filtered posts:', filteredPosts.length);

    const authorIds = Array.from(new Set(filteredPosts.map((doc) => doc.data().authorId)));

    // Batch fetch all authors
    const authorDocs = await Promise.all(
      authorIds.map((authorId) => getDoc(doc(firestore, 'users', authorId)))
    );
    const authorDataMap = new Map<string, any>();
    authorDocs.forEach((snap) => {
      if (snap.exists()) {
        authorDataMap.set(snap.id, snap.data());
      }
    });

    const connectionPosts: any[] = [];

    for (const postDoc of filteredPosts) {
      const postData = postDoc.data();
      const authorId = postData.authorId;
      const authorData = authorDataMap.get(authorId) || {};

      const authorLat = authorData.location?.latitude;
      const authorLon = authorData.location?.longitude;

      // Skip if no author location
      if (!authorLat || !authorLon) continue;

      // Distance filter (if applicable)
      if (userRadius && currentUserLocation) {
        const distance = calculateDistance(
          currentUserLocation.latitude,
          currentUserLocation.longitude,
          authorLat,
          authorLon
        );
        if (distance > userRadius) continue;
      }

      // Get likes & comments in parallel
      const [likesSnapshot, commentsSnapshot] = await Promise.all([
        getDocs(collection(firestore, 'posts', postDoc.id, 'likes')),
        getDocs(collection(firestore, 'posts', postDoc.id, 'comments')),
      ]);

      const isLikedByUser = likesSnapshot.docs.some(
        (likeDoc) => likeDoc.data().authorId === currentUser.uid
      );

      // Online status
      const isOnline =
        authorData.lastSeen?.toDate &&
        now - authorData.lastSeen.toDate().getTime() < 2 * 60 * 1000;

      connectionPosts.push({
        id: postDoc.id,
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

      // Break if we've reached the requested limit
      if (connectionPosts.length >= limitCount) break;
    }

    console.log('Final connection posts:', connectionPosts.length, 'requested limit:', limitCount);
    
    // Return only the requested number of posts
    return connectionPosts.slice(0, limitCount);
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
