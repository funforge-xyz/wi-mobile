
import { getFirestore, collection, getDocs, doc, updateDoc, GeoPoint } from 'firebase/firestore';
import { GeoFirestore } from 'geofirestore';

// Utility function to migrate existing user location data to GeoFirestore format
export const migrateUserLocationsToGeoFirestore = async (): Promise<void> => {
  try {
    const firestore = getFirestore();
    const usersRef = collection(firestore, 'users');
    const snapshot = await getDocs(usersRef);

    const updatePromises: Promise<void>[] = [];

    snapshot.docs.forEach((userDoc) => {
      const userData = userDoc.data();
      const location = userData.location;

      // Check if user has location but no coordinates (GeoPoint)
      if (location && location.latitude && location.longitude && !userData.coordinates) {
        const updatePromise = updateDoc(doc(firestore, 'users', userDoc.id), {
          coordinates: new GeoPoint(location.latitude, location.longitude)
        });
        updatePromises.push(updatePromise);
      }
    });

    await Promise.all(updatePromises);
    console.log(`Migrated ${updatePromises.length} user locations to GeoFirestore format`);
  } catch (error) {
    console.error('Error migrating user locations:', error);
  }
};

// Utility function to check if GeoFirestore is working properly
export const testGeoFirestore = async (
  userLocation: { latitude: number; longitude: number },
  radiusKm: number = 5
): Promise<boolean> => {
  try {
    const firestore = getFirestore();
    const geofirestore = new GeoFirestore(firestore);
    const geocollection = geofirestore.collection('users');
    
    const geoQuery = geocollection.near({
      center: new GeoPoint(userLocation.latitude, userLocation.longitude),
      radius: radiusKm
    });

    await geoQuery.limit(1).get();
    console.log('GeoFirestore test successful');
    return true;
  } catch (error) {
    console.error('GeoFirestore test failed:', error);
    return false;
  }
};

// Utility function to get nearby users count for debugging
export const getNearbyUsersCount = async (
  userLocation: { latitude: number; longitude: number },
  radiusKm: number,
  currentUserId: string
): Promise<number> => {
  try {
    const firestore = getFirestore();
    const geofirestore = new GeoFirestore(firestore);
    const geocollection = geofirestore.collection('users');
    
    const geoQuery = geocollection.near({
      center: new GeoPoint(userLocation.latitude, userLocation.longitude),
      radius: radiusKm
    });

    const snapshot = await geoQuery.get();
    let count = 0;
    
    snapshot.docs.forEach((doc) => {
      if (doc.id !== currentUserId) {
        count++;
      }
    });

    return count;
  } catch (error) {
    console.error('Error getting nearby users count:', error);
    return 0;
  }
};
