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

export const loadSettings = async (
  setPushNotificationsEnabled: (value: boolean) => void,
  setTrackingRadius: (value: number) => void,
  setLocationTrackingEnabled: (value: boolean) => void,
  setSameNetworkMatchingEnabled?: (value: boolean) => void
) => {
  try {
    const settings = new Settings();
    const pushEnabled = await settingsService.getPushNotifications();
    let savedRadiusInMeters = await settings.getTrackingRadius();

    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser || await authService.getCurrentUser();

      if (currentUser) {
        const firestore = getFirestore();
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().trackingRadius) {
          savedRadiusInMeters = userDoc.data().trackingRadius;
        }
      }
    } catch (error) {
      console.log('Could not load radius from Firebase, using local storage');
    }

    const radiusInKm = savedRadiusInMeters ? savedRadiusInMeters / 1000 : 0.1; // Default to 100m
    setTrackingRadius(radiusInKm);

    const hasLocationPermissions = await locationService.checkPermissions();
    const isTracking = locationService.isLocationTrackingActive();
    setLocationTrackingEnabled(hasLocationPermissions && isTracking);

    // Retrieve Same Network Matching from storage and set it
    const sameNetworkMatchingEnabled = await AsyncStorage.getItem('sameNetworkMatchingEnabled');
    if (setSameNetworkMatchingEnabled) {
      setSameNetworkMatchingEnabled(sameNetworkMatchingEnabled === 'true'); // Convert string to boolean
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
};

export const loadUserData = async (setEditedProfile: (profile: UserProfile) => void, setIsLoading: (loading: boolean) => void) => {
  setIsLoading(true);
  try {
    const { getAuth } = await import('../services/firebase');
    const auth = getAuth();
    const user = auth.currentUser || await authService.getCurrentUser();

    if (user) {
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        setEditedProfile({
          id: userDoc.data().id || '',
          firstName: userDoc.data().firstName || '',
          lastName: userDoc.data().lastName || '',
          email: userDoc.data().email || '',
          photoURL: userDoc.data().photoURL || '',
          thumbnailURL: userDoc.data().thumbnailURL || userDoc.data().photoURL || '',
          bio: userDoc.data().bio || '',
        });
      } else {
        console.warn('User document not found');
      }
    }
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
        Alert.alert(t('common.success'), t('settings.pushNotificationsEnabledSuccessfully'));
      } else {
        setPushNotificationsEnabled(false);
        if (setShowPushNotificationModal && setShowSettingsOption) {
          setShowPushNotificationModal(true);
        } else {
          Alert.alert(
            t('settings.permissionRequired'),
            t('settings.enableNotificationsInDeviceSettings'),
            [
              {
                text: t('common.cancel'),
                style: 'cancel',
              },
              {
                text: t('settings.openSettings'),
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        }
      }
    } else {
      setPushNotificationsEnabled(false);
      Alert.alert(t('settings.disabled'), t('settings.pushNotificationsDisabled'));
    }
  } catch (error) {
    console.error('Error toggling push notifications:', error);
    Alert.alert(t('common.error'), t('settings.failedToUpdateNotificationSettings'));
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

export const handleChangePassword = async (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
  setCurrentPassword: (value: string) => void,
  setNewPassword: (value: string) => void,
  setConfirmPassword: (value: string) => void,
  setShowChangePasswordModal: (show: boolean) => void,
  setIsLoading: (loading: boolean) => void,
  t: (key: string) => string
) => {
  if (!currentPassword || !newPassword || !confirmPassword) {
    Alert.alert(t('common.error'), t('settings.pleaseFillInAllFields'));
    return;
  }

  if (newPassword !== confirmPassword) {
    Alert.alert(t('common.error'), t('settings.newPasswordsDoNotMatch'));
    return;
  }

  if (currentPassword === newPassword) {
    Alert.alert(t('common.error'), t('settings.newPasswordMustBeDifferent'));
    return;
  }

  const passwordValidation = validatePassword(newPassword, t);
  if (!passwordValidation.isValid) {
    Alert.alert(t('settings.passwordRequirementsNotMet'), passwordValidation.errors.join('\n'));
    return;
  }

  setIsLoading(true);
  try {
    await authService.changePassword(currentPassword, newPassword);
    Alert.alert(t('common.success'), t('settings.passwordChangedSuccessfully'));
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowChangePasswordModal(false);
  } catch (error: any) {
    Alert.alert(t('common.error'), error.message);
  } finally {
    setIsLoading(false);
  }
};

export const handleDeleteAccount = async (
  setShowDeleteAccountModal: (show: boolean) => void,
  setIsLoading: (loading: boolean) => void,
  t: (key: string) => string
) => {
  Alert.alert(
    t('settings.deleteAccount'),
    t('settings.areYouSureYouWantToDeleteAccount'),
    [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('settings.delete'),
        style: 'destructive',
        onPress: async () => {
          setIsLoading(true);
          try {
            const { authService } = await import('../services/auth');
            await authService.deleteProfile();
            setShowDeleteAccountModal(false);
          } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
            setIsLoading(false);
          }
        },
      },
    ]
  );
};

export const compressImage = async (uri: string): Promise<string> => {
  try {
    const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');

    const response = await fetch(uri);
    const blob = await response.blob();
    let initialSize = blob.size;

    console.log('Initial image size:', (initialSize / 1024 / 1024).toFixed(2), 'MB');

    let quality = 0.8;
    let compressedUri = uri;

    while (initialSize > 5242880 && quality > 0.1) {
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
  const options = [t('settings.takePhoto'), t('settings.chooseFromLibrary'), t('common.cancel')];

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
        text: t('settings.chooseFromLibrary'),
        onPress: handleImagePicker,
      },
      {
        text: t('settings.takePhoto'),
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

export const changeLanguage = (
  language: string,
  i18n: any,
  setShowLanguageModal: (show: boolean) => void
) => {
  i18n.changeLanguage(language);
  setShowLanguageModal(false);
};