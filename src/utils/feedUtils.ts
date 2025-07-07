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

export const loadConnectionPosts = async (
  userRadius: number | null,
  currentUserLocation: { latitude: number; longitude: number } | null,
  lastTimestamp: Date | null = null,
  pageSize: number = 10
): Promise<ConnectionPost[]> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const firestore = getFirestore();

    // Get current user's data including location and settings
    const userDocRef = doc(firestore, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();

    if (!userData) {
      throw new Error('User data not found');
    }

    const userLocation = userData.location || currentUserLocation;
    const currentUserRadius = userData.radius || userRadius || 100; // Default 100km
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

      const lastSeen = user.lastSeen?.toDate();
      const isOnline = lastSeen && (now.getTime() - lastSeen.getTime()) < onlineThreshold;

      // Check if user is on same network
      const isSameNetwork = sameNetworkMatchingEnabled && 
                           currentUserNetworkId && 
                           user.currentNetworkId === currentUserNetworkId;

      // Check if user is a connection
      const isConnection = connectedUserIds.has(userId);

      let shouldInclude = false;
      let distance = 0;

      if (isSameNetwork) {
        // Always include same network users
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
          const userRadius = user.radius || 100;
          const effectiveRadius = Math.min(currentUserRadius, userRadius);

          shouldInclude = distance <= effectiveRadius;
        }
      }

      if (shouldInclude) {
        eligibleUsers.set(userId, {
          ...user,
          id: userId,
          isOnline,
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

    // Get posts from eligible users created within last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const posts: ConnectionPost[] = [];
    const postsPerUser = Math.ceil(pageSize / Math.min(sortedUserIds.length, 10)); // Distribute pageSize among users

    // Get current user's likes to check if posts are liked
    const currentUserLikesQuery = query(
      collection(firestore, 'likes'),
      where('userId', '==', currentUser.uid)
    );
    const likesSnapshot = await getDocs(currentUserLikesQuery);
    const likedPostIds = new Set(likesSnapshot.docs.map(doc => doc.data().postId));

    for (const userId of sortedUserIds) {
      if (posts.length >= pageSize) break;

      const userInfo = eligibleUsers.get(userId);

      // Build posts query for this user
      let postsQuery = query(
        collection(firestore, 'posts'),
        where('authorId', '==', userId),
        where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
        orderBy('createdAt', 'desc'),
        limit(postsPerUser)
      );

      // Add pagination if needed
      if (lastTimestamp) {
        postsQuery = query(
          collection(firestore, 'posts'),
          where('authorId', '==', userId),
          where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
          where('createdAt', '<', Timestamp.fromDate(lastTimestamp)),
          orderBy('createdAt', 'desc'),
          limit(postsPerUser)
        );
      }

      const userPostsSnapshot = await getDocs(postsQuery);

      for (const postDoc of userPostsSnapshot.docs) {
        if (posts.length >= pageSize) break;

        const postData = postDoc.data();
        const postId = postDoc.id;

        // Get likes count for this post
        const likesQuery = query(
          collection(firestore, 'likes'),
          where('postId', '==', postId)
        );
        const postLikesSnapshot = await getDocs(likesQuery);

        // Get comments count for this post
        const commentsQuery = query(
          collection(firestore, 'comments'),
          where('postId', '==', postId)
        );
        const commentsSnapshot = await getDocs(commentsQuery);

        console.log('feedUtils - Firebase post data:', {
          id: postId,
          isFrontCamera: postData.isFrontCamera,
          mediaType: postData.mediaType,
          hasMediaURL: !!postData.mediaURL
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
          likesCount: postLikesSnapshot.size,
          commentsCount: commentsSnapshot.size,
          showLikeCount: postData.showLikeCount ?? true,
          allowComments: postData.allowComments ?? true,
          isLikedByUser: likedPostIds.has(postId),
          isAuthorOnline: userInfo.isOnline,
          isFromConnection: userInfo.isConnection
        });
      }
    }

    // Sort all posts by creation date (newest first)
    posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return posts.slice(0, pageSize);

  } catch (error) {
    console.error('Error loading connection posts:', error);
    return [];
  }
};

export const updateUserLastSeen = async (): Promise<void> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return;
    }

    const firestore = getFirestore();
    const userDocRef = doc(firestore, 'users', currentUser.uid);

    // Use server timestamp for consistency
    const { serverTimestamp, updateDoc } = await import('firebase/firestore');
    await updateDoc(userDocRef, {
      lastSeen: serverTimestamp()
    });

  } catch (error) {
    console.error('Error updating user last seen:', error);
  }
};

export const loadUserSettings = async (): Promise<number | null> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return null;
    }

    const firestore = getFirestore();
    const userDocRef = doc(firestore, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.radius || null;
    }

    return null;
  } catch (error) {
    console.error('Error loading user settings:', error);
    return null;
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
import { DocumentSnapshot } from 'firebase/firestore';

export const loadFeedPosts = async (
  pageSize: number = 10,
  lastDoc?: DocumentSnapshot,
  currentUserId?: string
): Promise<{ posts: ConnectionPost[]; lastDoc?: DocumentSnapshot; hasMore: boolean }> => {
  try {
    const firestore = getFirestore();

    let q = query(
      collection(firestore, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    if (lastDoc) {
      q = query(
        collection(firestore, 'posts'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }

    const querySnapshot = await getDocs(q);

    const posts = await Promise.all(
    querySnapshot.docs.map(async (postDoc) => {
      const postData = postDoc.data();
      const authorId = postData.authorId;

       // Load user data
       const userDoc = await getDoc(doc(firestore, 'users', authorId));
       const userData = userDoc.data();

      // Load likes count and check if user liked
      const likesCollection = collection(firestore, 'likes'),
          likesQuery = query(likesCollection, where('postId', '==', postDoc.id));
      const likesSnapshot = await getDocs(likesQuery);


      let isLikedByUser = false;
      likesSnapshot.forEach((likeDoc) => {
          if (likeDoc.data().userId === currentUserId) {
            isLikedByUser = true;
          }
        });


      // Load comments count
      const commentsCollection = collection(firestore, 'comments');
      const commentsQuery = query(commentsCollection, where('postId', '==', postDoc.id));
      const commentsSnapshot = await getDocs(commentsQuery);

      // Load replies count (assuming replies are in a subcollection called "replies")
      let totalRepliesCount = 0;
      for (const commentDoc of commentsSnapshot.docs) {
          const repliesCollection = collection(firestore, 'comments', commentDoc.id, 'replies');
          const repliesQuery = query(repliesCollection);
          const repliesSnapshot = await getDocs(repliesQuery);
          totalRepliesCount += repliesSnapshot.size;
      }

      console.log('feedUtils - Firebase feed post data:', {
        id: postDoc.id,
        isFrontCamera: postData.isFrontCamera,
        mediaType: postData.mediaType,
        hasMediaURL: !!postData.mediaURL
      });

      return {
        id: postDoc.id,
        authorId: postData.authorId,
        authorName: postData.authorName,
        authorPhotoURL: userData?.photoURL || '',
        content: postData.content || '',
        mediaURL: postData.mediaURL,
        mediaType: postData.mediaType,
        isFrontCamera: postData.isFrontCamera,
        createdAt: postData.createdAt?.toDate?.() || new Date(),
        likesCount: likesSnapshot.size,
        commentsCount: commentsSnapshot.size + totalRepliesCount,
        isLikedByUser: isLikedByUser,
        isAuthorOnline: userData?.lastSeen?.toDate && (Date.now() - userData.lastSeen.toDate().getTime() < 2 * 60 * 1000),
        isFromConnection: false, // You may want to implement proper connection checking logic here
      };
    })
  );
    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

    return { posts, lastDoc: newLastDoc, hasMore: querySnapshot.docs.length === pageSize };
  } catch (error) {
    console.error('Error loading feed posts:', error);
    return { posts: [], hasMore: false };
  }
};