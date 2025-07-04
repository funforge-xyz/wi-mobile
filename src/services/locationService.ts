import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from './firebase';

const LOCATION_TASK_NAME = 'background-location-task';
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Define the background task with error handling
try {
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.error('Background location task error:', error);
      return;
    }

    if (data) {
      try {
        const { locations } = data as any;
        const location = locations[0];

        if (location) {
          await updateUserLocationInFirestore(
            location.coords.latitude,
            location.coords.longitude
          );
        }
      } catch (taskError) {
        console.error('Error processing location in background task:', taskError);
      }
    }
  });
} catch (defineError) {
  console.error('Failed to define location background task:', defineError);
}

export class LocationService {
  private static instance: LocationService;
  private isTracking = false;
  private permissionModalCallback?: (showModal: boolean, permissionDenied?: boolean, hasTriedRequest?: boolean) => void;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  setPermissionModalCallback(callback: (showModal: boolean, permissionDenied?: boolean, hasTriedRequest?: boolean) => void) {
    this.permissionModalCallback = callback;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      console.log('🗺️ Requesting location permissions...');

      // First check if permissions are already granted
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

      if (existingStatus === 'granted') {
        console.log('✅ Location permission already granted');
        // Also check background permissions
        const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          console.log('📍 Requesting background location permission...');
          const { status: newBackgroundStatus } = await Location.requestBackgroundPermissionsAsync();
          if (newBackgroundStatus !== 'granted') {
            console.log('❌ Background location permission denied');
            if (this.permissionModalCallback) {
              this.permissionModalCallback(true, true, true);
            }
            return false;
          }
        }
        return true;
      }

      // Request foreground permissions first
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.log('❌ Location permission denied, showing modal...');
        if (this.permissionModalCallback) {
          this.permissionModalCallback(true, status === 'denied', true);
        }
        return false;
      }

      // Request background permissions
      console.log('📍 Requesting background location permission...');
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.log('❌ Background location permission denied');
        if (this.permissionModalCallback) {
          this.permissionModalCallback(true, true, true);
        }
        return false;
      }

      console.log('✅ Location permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      if (this.permissionModalCallback) {
        this.permissionModalCallback(true, true, true);
      }
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
          console.log('Failed to get location with fallback, trying last known position:', fallbackError);
          try {
            currentLocation = await Location.getLastKnownPositionAsync({
              maxAge: 60000, // Accept location up to 1 minute old
            });
            if (!currentLocation) {
              console.log('No last known position available, skipping location tracking');
              return false;
            }
          } catch (lastKnownError) {
            console.log('Failed to get last known position, skipping location tracking:', lastKnownError);
            return false;
          }
        }
      }

      await updateUserLocationInFirestore(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );

      // Ensure the background task is properly defined before starting
      const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (!isTaskDefined) {
        console.log('Location task not defined, it should be defined at module level');
        // The task should already be defined at the top level, but if not, we can't proceed
        return false;
      }

      // Start background location updates
      try {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: UPDATE_INTERVAL,
          distanceInterval: 50, // Update if moved more than 50 meters
          deferredUpdatesInterval: UPDATE_INTERVAL,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'Location Tracking',
            notificationBody: 'WiChat is tracking your location to find nearby users',
          },
        });
      } catch (startError) {
        console.error('Failed to start location updates:', startError);
        return false;
      }

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

      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
        });
      } catch (error) {
        console.log('Failed to get current location, trying with lower accuracy:', error);
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
            timeInterval: 15000,
          });
        } catch (fallbackError) {
          console.log('Failed with low accuracy, trying last known position:', fallbackError);
          location = await Location.getLastKnownPositionAsync({
            maxAge: 300000, // Accept location up to 5 minutes old
          });
          if (!location) {
            return null;
          }
        }
      }

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

    // Get enhanced WiFi network info
    const { wifiService } = await import('./wifiService');
    const wifiInfo = await wifiService.getCurrentWifiInfo();
    
    const updateData: any = {
      location: {
        latitude,
        longitude
      },
      lastUpdatedLocation: new Date(),
      lastSeen: new Date(), // Add last seen for online status
    };

    // Basic network info (Flutter-style)
    if (wifiInfo.isConnected && wifiInfo.networkId) {
      updateData.currentNetworkId = wifiInfo.networkId;
      updateData.lastNetworkUpdate = new Date();
    } else {
      // Clear network info if not connected to WiFi
      updateData.currentNetworkId = null;
    }

    await updateDoc(userRef, updateData);

    console.log('User location and network updated in Firestore:', { 
      location: { latitude, longitude }, 
      networkId: wifiInfo.networkId
    });
  } catch (error) {
    console.error('Error updating user location in Firestore:', error);
  }
}

export const locationService = LocationService.getInstance();