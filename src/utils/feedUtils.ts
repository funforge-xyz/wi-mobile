
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

export const loadConnectionPosts = async (userRadius: number | null, currentUserLocation: any) => {
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

    // Get all public posts (not just from connections)
    const postsCollection = collection(firestore, 'posts');
    const postsQuery = query(
      postsCollection,
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    console.log('Fetching posts from Firestore...');
    const postsSnapshot = await getDocs(postsQuery);
    console.log('Posts fetched:', postsSnapshot.size);

    const connectionPosts: any[] = [];

    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data();

      // Skip current user's own posts
      if (postData.authorId === currentUser.uid) {
        continue;
      }

      // Skip private posts
      if (postData.isPrivate === true) {
        continue;
      }

      // Get author information
      const authorDoc = await getDoc(doc(firestore, 'users', postData.authorId));
      const authorData = authorDoc.exists() ? authorDoc.data() : {};

      // Check if author has location data (always required)
      const authorLat = authorData.location?.latitude;
      const authorLon = authorData.location?.longitude;

      // Skip post if author doesn't have location data
      if (!authorLat || !authorLon) {
        continue;
      }

      // Location-based filtering (if radius is set)
      if (userRadius && currentUserLocation) {
        // Calculate distance between current user and post author
        const distance = calculateDistance(
          currentUserLocation.latitude,
          currentUserLocation.longitude,
          authorLat,
          authorLon
        );

        // Skip post if author is outside the radius
        if (distance > userRadius) {
          continue;
        }
      }

      // Get likes count and check if user liked
      const likesCollection = collection(firestore, 'posts', postDoc.id, 'likes');
      const likesSnapshot = await getDocs(likesCollection);

      let isLikedByUser = false;
      likesSnapshot.forEach((likeDoc) => {
        if (likeDoc.data().authorId === currentUser.uid) {
          isLikedByUser = true;
        }
      });

      // Get comments count
      const commentsCollection = collection(firestore, 'posts', postDoc.id, 'comments');
      const commentsSnapshot = await getDocs(commentsCollection);

      // Check if user is online (last seen within 2 minutes to be more accurate)
      const isOnline = authorData.lastSeen && 
        authorData.lastSeen.toDate && 
        (new Date().getTime() - authorData.lastSeen.toDate().getTime()) < 2 * 60 * 1000;

      const postInfo = {
        id: postDoc.id,
        authorId: postData.authorId,
        authorName: authorData.firstName && authorData.lastName 
          ? `${authorData.firstName} ${authorData.lastName}` 
          : 'Anonymous User',
        authorPhotoURL: authorData.thumbnailURL || authorData.photoURL || '',
        content: postData.content || '',
        mediaURL: postData.mediaURL || '',
        mediaType: postData.mediaType || 'image',
        createdAt: postData.createdAt?.toDate() || new Date(),
        likesCount: likesSnapshot.size,
        commentsCount: commentsSnapshot.size,
        showLikeCount: postData.showLikeCount !== false,
        allowComments: postData.allowComments !== false,
        isLikedByUser: isLikedByUser,
        isAuthorOnline: isOnline || false,
        isFromConnection: connectedUserIds.has(postData.authorId),
      };

      connectionPosts.push(postInfo);

      // Limit to 20 posts for performance
      if (connectionPosts.length >= 20) {
        break;
      }
    }

    return connectionPosts;
  } catch (error) {
    console.error('Error loading connection posts:', error);
    // Don't show alert if it's just a timeout or network issue
    if (error.code !== 'cancelled' && error.code !== 'timeout') {
      Alert.alert('Error', 'Failed to load posts. Please check your connection and try again.');
    }
    return [];
  }
};
