import { Alert, Platform, Linking, ActionSheetIOS } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageService, Settings } from '../services/storage';
import { settingsService } from '../services/settings';
import { authService } from '../services/auth';
import { locationService } from '../services/locationService';
import { initializeNotifications } from '../services/notifications';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import { launchCamera, launchImagePicker, showImagePickerOptions as showImageOptions } from './modalUtils';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  thumbnailURL: string;
  bio: string;
}

// Load settings from storage
export const loadSettings = async (
  setPushNotificationsEnabled: (value: boolean) => void,
  setTrackingRadius: (value: number) => void,
  setLocationTrackingEnabled: (value: boolean) => void,
  setSameNetworkMatchingEnabled?: (value: boolean) => void
) => {
  try {
    const settings = await settingsService.loadSettings();
    setPushNotificationsEnabled(settings.pushNotificationsEnabled);
    
    let finalRadiusInMeters = settings.trackingRadius;

    // Try to get the latest radius from Firebase
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser || await authService.getCurrentUser();

      if (currentUser) {
        const firestore = getFirestore();
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().trackingRadius) {
          finalRadiusInMeters = userDoc.data().trackingRadius;
          // Update local storage with Firebase value
          await settingsService.setTrackingRadius(finalRadiusInMeters);
        }
      }
    } catch (firebaseError) {
      console.log('Could not sync radius from Firebase, using local value');
    }
    
    // Convert tracking radius from meters to kilometers for display
    const radiusInKm = finalRadiusInMeters / 1000;
    setTrackingRadius(radiusInKm);
    
    const locationTracking = await settingsService.getLocationTracking();
    setLocationTrackingEnabled(locationTracking);

    if (setSameNetworkMatchingEnabled) {
      const sameNetworkMatching = await settingsService.getSameNetworkMatching();
      setSameNetworkMatchingEnabled(sameNetworkMatching);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
};

// Load user data for profile editing
export const loadUserData = async (
  setEditedProfile: (profile: any) => void,
  setIsLoading: (loading: boolean) => void
) => {
  try {
    setIsLoading(true);
    // This will be handled by the profile state from Redux
    // No need to fetch here as it's already available in the component
  } catch (error) {
    console.error('Error loading user data:', error);
  } finally {
    setIsLoading(false);
  }
};

export const handleTogglePushNotifications = async (
  value: boolean,
  setPushNotificationsEnabled: (value: boolean) => void,
  setIsLoading: (loading: boolean) => void,
  t: (key: string) => string,
  setShowPushNotificationModal?: (show: boolean) => void,
  setShowSettingsOption?: (show: boolean) => void
) => {
  setIsLoading(true);
  try {
    if (value) {
      const token = await initializeNotifications();
      if (token) {
        setPushNotificationsEnabled(true);
        // Success - no alert needed, just enable the setting
      } else {
        setPushNotificationsEnabled(false);
        if (setShowPushNotificationModal) {
          setShowPushNotificationModal(true);
        }
      }
    } else {
      setPushNotificationsEnabled(false);
      // No alert when disabling notifications
    }
  } catch (error) {
    console.error('Error toggling push notifications:', error);
    // Only show error for actual failures, not permission denials
    if (setShowPushNotificationModal) {
      setShowPushNotificationModal(true);
    }
  } finally {
    setIsLoading(false);
  }
};

export const handleToggleLocationTracking = async (
  value: boolean,
  setLocationTrackingEnabled: (value: boolean) => void,
  setIsLoading: (loading: boolean) => void,
  t: (key: string) => string
) => {
  setIsLoading(true);

  try {
    if (value) {
      const success = await locationService.startLocationTracking();
      if (success) {
        setLocationTrackingEnabled(true);
      } else {
        // Permission not granted, but don't show alert
        setLocationTrackingEnabled(false);
      }
    } else {
      await locationService.stopLocationTracking();
      setLocationTrackingEnabled(false);
    }
  } catch (error) {
    console.error('Error toggling location tracking:', error);
    setLocationTrackingEnabled(!value); // Revert to previous state
  } finally {
    setIsLoading(false);
  }
};

export const handleToggleSameNetworkMatching = async (
  value: boolean,
  setSameNetworkMatchingEnabled: (value: boolean) => void,
  setIsLoading: (loading: boolean) => void,
  t: (key: string) => string
) => {
  setIsLoading(true);
  try {
    await settingsService.setSameNetworkMatching(value);
    setSameNetworkMatchingEnabled(value);

    // Also update Firebase if user is logged in
    const { getAuth } = await import('../services/firebase');
    const auth = getAuth();
    const currentUser = auth.currentUser || await authService.getCurrentUser();

    if (currentUser) {
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        sameNetworkMatching: value,
        sameNetworkMatchingUpdatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error updating same network matching:', error);
    setSameNetworkMatchingEnabled(!value); // Revert on error
  } finally {
    setIsLoading(false);
  }
};

export const handleTrackingRadiusChange = async (
  radius: number,
  setTrackingRadius: (value: number) => void,
  t: (key: string) => string
) => {
  try {
    setTrackingRadius(radius);
    const radiusInMeters = radius * 1000;
    const settings = new Settings();
    await settings.setTrackingRadius(radiusInMeters);

    const { getAuth } = await import('../services/firebase');
    const auth = getAuth();
    const currentUser = auth.currentUser || await authService.getCurrentUser();

    if (currentUser) {
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        trackingRadius: radiusInMeters,
        trackingRadiusUpdatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error updating tracking radius:', error);
    // Silently handle error without showing alert
  }
};

export const validatePassword = (password: string, t: (key: string) => string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push(t('settings.atLeast8CharactersLong'));
  }

  if (!/[A-Z]/.test(password)) {
    errors.push(t('settings.atLeastOneUppercaseLetter'));
  }

  if (!/[a-z]/.test(password)) {
    errors.push(t('settings.atLeastOneLowercaseLetter'));
  }

  if (!/\d/.test(password)) {
    errors.push(t('settings.atLeastOneNumber'));
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push(t('settings.atLeastOneSpecialCharacter'));
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Delete account logic is now handled directly in DeleteAccountModal component

export const compressImage = async (uri: string): Promise<string> => {
  try {
    const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');

    const response = await fetch(uri);
    const blob = await response.blob();
    let initialSize = blob.size;

    console.log('Initial image size:', (initialSize / 1024 / 1024).toFixed(2), 'MB');

    let quality = 0.7;
    let compressedUri = uri;

    while (initialSize > 5242880 && quality > 0.3) {
      const result = await manipulateAsync(
        compressedUri,
        [{ resize: { width: 1920 } }],
        {
          compress: quality,
          format: SaveFormat.JPEG,
        }
      );

      const newResponse = await fetch(result.uri);
      const newBlob = await newResponse.blob();
      initialSize = newBlob.size;
      compressedUri = result.uri;

      console.log('Compressed to quality', quality, 'Size:', (initialSize / 1024 / 1024).toFixed(2), 'MB');

      quality -= 0.1;
    }

    if (initialSize > 5242880) {
      throw new Error('Unable to compress image below 5MB');
    }

    console.log('Final compressed size:', (initialSize / 1024 / 1024).toFixed(2), 'MB');
    return compressedUri;
  } catch (error) {
    console.error('Image compression error:', error);
    throw error;
  }
};

export const showImagePickerOptions = (
  handleCameraCapture: () => void,
  handleImagePicker: () => void,
  t: (key: string) => string
) => {
  const options = [t('addPost.takePhoto'), t('addPost.chooseFromLibrary'), t('common.cancel')];

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 2,
      },
      buttonIndex => {
        if (buttonIndex === 0) {
          handleCameraCapture();
        } else if (buttonIndex === 1) {
          handleImagePicker();
        }
      }
    );
  } else {
    const alertOptions = [
      {
        text: t('common.cancel'),
        style: 'cancel' as const,
      },
      {
        text: t('addPost.chooseFromLibrary'),
        onPress: handleImagePicker,
      },
      {
        text: t('addPost.takePhoto'),
        onPress: handleCameraCapture,
      },
    ];

    Alert.alert(
      t('settings.chooseAnOption'),
      t('settings.selectHowToSetProfilePicture'),
      alertOptions,
      { cancelable: true }
    );
  }
};

export const handleImagePicker = async (
  editedProfile: UserProfile,
  setEditedProfile: (profile: UserProfile) => void,
  setIsLoading: (loading: boolean) => void,
  t: (key: string) => string
) => {
  setIsLoading(true);
  const imageUri = await launchImagePicker(t);
  if (imageUri) {
    setEditedProfile({
      ...editedProfile,
      photoURL: imageUri,
      thumbnailURL: imageUri,
    });
  }
  setIsLoading(false);
};

export const handleCameraCapture = async (
  editedProfile: UserProfile,
  setEditedProfile: (profile: UserProfile) => void,
  setIsLoading: (loading: boolean) => void,
  t: (key: string) => string
) => {
  setIsLoading(true);
  const imageUri = await launchCamera(t);
  if (imageUri) {
    setEditedProfile({
      ...editedProfile,
      photoURL: imageUri,
      thumbnailURL: imageUri,
    });
  }
  setIsLoading(false);
};

export const getCurrentLanguageName = (language: string) => {
  return language === 'bs' ? 'Bosanski' : 'English';
};

export const changeLanguage = async (code: string, i18n: any, setShowLanguageModal: (show: boolean) => void) => {
  try {
    await i18n.changeLanguage(code);
    setShowLanguageModal(false);

    // Store language preference locally
    // const settings = new Settings();
    // await settings.setLanguage(code);

    // Store language preference in Firebase (only when changed in settings)
    try {
      const { getAuth } = await import('../services/firebase');
      const { getFirestore } = await import('../services/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');

      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        const firestore = getFirestore();
        const userRef = doc(firestore, 'users', currentUser.uid);
        await updateDoc(userRef, {
          preferredLanguage: code,
          languageUpdatedAt: new Date().toISOString(),
        });
        console.log('Language preference saved to Firebase:', code);
      }
    } catch (firebaseError) {
      console.error('Failed to save language preference to Firebase:', firebaseError);
      // Continue even if Firebase update fails
    }
  } catch (error) {
    console.error('Failed to change language:', error);
  }
};