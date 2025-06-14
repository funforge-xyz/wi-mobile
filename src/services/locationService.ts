
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from './firebase';

const LOCATION_TASK_NAME = 'background-location-task';
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as any;
    const location = locations[0];
    
    if (location) {
      await updateUserLocationInFirestore(
        location.coords.latitude,
        location.coords.longitude
      );
    }
  }
});

export class LocationService {
  private static instance: LocationService;
  private isTracking = false;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      // Request foreground location permission
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.log('Foreground location permission denied');
        return false;
      }

      // Request background location permission
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.log('Background location permission denied');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async startLocationTracking(): Promise<boolean> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.log('Location permissions not granted, skipping location tracking');
        return false;
      }

      // Get current location first with timeout and fallback
      let currentLocation;
      try {
        currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // 10 second timeout
        });
      } catch (locationError) {
        console.log('Failed to get current location, trying with lower accuracy:', locationError);
        try {
          currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
            timeInterval: 15000, // 15 second timeout
          });
        } catch (fallbackError) {
          console.log('Failed to get location with fallback, skipping location tracking:', fallbackError);
          return false;
        }
      }

      await updateUserLocationInFirestore(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );

      // Start background location updates
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: UPDATE_INTERVAL,
        distanceInterval: 100, // Update if moved more than 100 meters
        deferredUpdatesInterval: UPDATE_INTERVAL,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Location Tracking',
          notificationBody: 'WiChat is tracking your location to find nearby users',
        },
      });

      this.isTracking = true;
      console.log('Background location tracking started');
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  async stopLocationTracking(): Promise<void> {
    try {
      const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (isTaskDefined) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
      this.isTracking = false;
      console.log('Background location tracking stopped');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const foreground = await Location.getForegroundPermissionsAsync();
      const background = await Location.getBackgroundPermissionsAsync();
      
      return foreground.status === 'granted' && background.status === 'granted';
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }

  isLocationTrackingActive(): boolean {
    return this.isTracking;
  }
}

// Helper function to update user location in Firestore
async function updateUserLocationInFirestore(latitude: number, longitude: number): Promise<void> {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log('No authenticated user found');
      return;
    }

    const firestore = getFirestore();
    const userRef = doc(firestore, 'users', currentUser.uid);

    await updateDoc(userRef, {
      lastUpdatedLatitude: latitude,
      lastUpdatedLongitude: longitude,
      lastUpdatedLocation: new Date(),
      location: {
        latitude,
        longitude,
      },
    });

    console.log('User location updated in Firestore:', { latitude, longitude });
  } catch (error) {
    console.error('Error updating user location in Firestore:', error);
  }
}

export const locationService = LocationService.getInstance();
