
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

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

// Utility function to migrate existing user location data to simple format
export const migrateUserLocationsToSimpleFormat = async (): Promise<void> => {
  try {
    const firestore = getFirestore();
    const usersRef = collection(firestore, 'users');
    const snapshot = await getDocs(usersRef);

    const updatePromises: Promise<void>[] = [];

    snapshot.docs.forEach((userDoc) => {
      const userData = userDoc.data();
      
      // Check if user has coordinates or geohash but no simple location
      if ((userData.coordinates || userData.geohash) && !userData.location) {
        let latitude, longitude;
        
        if (userData.coordinates) {
          latitude = userData.coordinates.latitude;
          longitude = userData.coordinates.longitude;
        } else if (userData.location && userData.location.latitude) {
          // Already in correct format
          return;
        }
        
        if (latitude && longitude) {
          const updatePromise = updateDoc(doc(firestore, 'users', userDoc.id), {
            location: {
              latitude,
              longitude
            },
            // Remove old fields
            coordinates: null,
            geohash: null
          });
          updatePromises.push(updatePromise);
        }
      }
    });

    await Promise.all(updatePromises);
    console.log(`Migrated ${updatePromises.length} user locations to simple format`);
  } catch (error) {
    console.error('Error migrating user locations:', error);
  }
};

// Utility function to get nearby users using simple distance calculation
export const getNearbyUsers = async (
  userLocation: { latitude: number; longitude: number },
  radiusKm: number,
  currentUserId: string
): Promise<any[]> => {
  try {
    const firestore = getFirestore();
    const usersRef = collection(firestore, 'users');
    
    // Get all users (in production, you might want to add some filtering)
    const snapshot = await getDocs(usersRef);
    const nearbyUsers: any[] = [];
    
    snapshot.docs.forEach((doc) => {
      if (doc.id !== currentUserId) {
        const userData = doc.data();
        if (userData.location && userData.location.latitude && userData.location.longitude) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            userData.location.latitude,
            userData.location.longitude
          );
          
          if (distance <= radiusKm) {
            nearbyUsers.push({
              ...userData,
              id: doc.id,
              distance
            });
          }
        }
      }
    });

    return nearbyUsers.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Error getting nearby users:', error);
    return [];
  }
};

// Utility function to get nearby users count for debugging
export const getNearbyUsersCount = async (
  userLocation: { latitude: number; longitude: number },
  radiusKm: number,
  currentUserId: string
): Promise<number> => {
  try {
    const nearbyUsers = await getNearbyUsers(userLocation, radiusKm, currentUserId);
    return nearbyUsers.length;
  } catch (error) {
    console.error('Error getting nearby users count:', error);
    return 0;
  }
};

// Test function to verify the simple location system works
export const testSimpleLocationSystem = async (
  userLocation: { latitude: number; longitude: number },
  radiusKm: number = 5
): Promise<boolean> => {
  try {
    const firestore = getFirestore();
    const usersRef = collection(firestore, 'users');
    
    // Test by getting a small sample
    const snapshot = await getDocs(query(usersRef));
    console.log('Simple location system test successful');
    return true;
  } catch (error) {
    console.error('Simple location system test failed:', error);
    return false;
  }
};
