import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActionSheetIOS,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { toggleTheme } from '../store/themeSlice';
import { authService } from '../services/auth';
import { Settings, storageService } from '../services/storage';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { Ionicons } from '@expo/vector-icons';
import { initializeNotifications } from '../services/notifications';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import SkeletonLoader from '../components/SkeletonLoader';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  thumbnailURL: string;
  bio: string;
}

export default function SettingsScreen() {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    setShowLanguageModal(false);
  };

  const getCurrentLanguageName = () => {
    return i18n.language === 'bs' ? 'Bosanski' : 'English';
  };

  const showLanguageOptions = () => {
    setShowLanguageModal(true);
  };
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [trackingRadius, setTrackingRadius] = useState(1); // Default 1km
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showRadiusModal, setShowRadiusModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    photoURL: '',
    thumbnailURL: '',
    bio: '',
  });
  const [editedProfile, setEditedProfile] = useState(profile);
  const settings = new Settings();

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    loadSettings();
    loadUserProfile();
  }, []);

  const loadSettings = async () => {
    try {
      // Load push notification settings
      const { status } = await Notifications.getPermissionsAsync();
      setPushNotificationsEnabled(status === 'granted');

      // Load tracking radius setting from local storage first
      let savedRadiusInMeters = await settings.getTrackingRadius();

      // Try to load from Firebase user document
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

      // Convert meters to kilometers for display (default 1000m = 1km)
      const radiusInKm = savedRadiusInMeters ? Math.round(savedRadiusInMeters / 1000) : 1;
      setTrackingRadius(radiusInKm);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser || await authService.getCurrentUser();

      if (currentUser) {
        const firestore = getFirestore();
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        let userData: UserProfile;

        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          userData = {
            id: currentUser.uid,
            firstName: firestoreData.firstName || '',
            lastName: firestoreData.lastName || '',
            email: currentUser.email || '',
            photoURL: firestoreData.photoURL || '',
            thumbnailURL: firestoreData.thumbnailURL || '',
            bio: firestoreData.bio || '',
          };
        } else {
          userData = {
            id: currentUser.uid,
            firstName: '',
            lastName: '',
            email: currentUser.email || '',
            photoURL: '',
            thumbnailURL: '',
            bio: '',
          };
        }

        setProfile(userData);
        setEditedProfile(userData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleToggleTheme = async () => {
    const newValue = !isDarkMode;
    dispatch(toggleTheme());
    await settings.setDarkMode(newValue);
  };

  const handleTogglePushNotifications = async (value: boolean) => {
    setIsLoading(true);

    try {
      if (value) {
        // Request permission and initialize notifications
        const token = await initializeNotifications();
        if (token) {
          setPushNotificationsEnabled(true);
          Alert.alert('Success', 'Push notifications enabled successfully');
        } else {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive updates',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Open Settings',
                onPress: () => Notifications.openSettingsAsync(),
              },
            ]
          );
        }
      } else {
        // For disabling, we can't revoke permissions but we can stop handling them
        setPushNotificationsEnabled(false);
        Alert.alert('Disabled', 'Push notifications have been disabled');
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackingRadiusChange = async (radius: number) => {
    try {
      setTrackingRadius(radius);
      // Save radius in meters to Firebase (1km = 1000m)
      const radiusInMeters = radius * 1000;
      await settings.setTrackingRadius(radiusInMeters);

      // Also save to user's Firestore document
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser || await authService.getCurrentUser();

      if (currentUser) {
        const firestore = getFirestore();
        const { doc, updateDoc } = await import('firebase/firestore');
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
          trackingRadius: radiusInMeters,
          trackingRadiusUpdatedAt: new Date()
        });
      }

      Alert.alert('Settings Updated', `Tracking radius set to ${radius}km`);
    } catch (error) {
      console.error('Error updating tracking radius:', error);
      Alert.alert('Error', 'Failed to update tracking radius');
    }
  };

  const showRadiusOptions = () => {
    setShowRadiusModal(true);
  };

  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('• At least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('• At least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('• At least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('• At least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('• At least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      Alert.alert('Password Requirements Not Met', passwordValidation.errors.join('\n'));
      return;
    }

    setIsLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePasswordModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const { authService } = await import('../services/auth');
              await authService.deleteProfile();
              setShowDeleteAccountModal(false);
              // Navigation will be handled by the auth service callback
            } catch (error: any) {
              Alert.alert('Error', error.message);
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    setEditedProfile(profile);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);

      let photoURL = editedProfile.photoURL;
      let thumbnailURL = editedProfile.thumbnailURL;

      // Delete old images from storage if removing image
      if (!photoURL && (profile.photoURL || profile.thumbnailURL)) {
        try {
          await storageService.deleteProfilePicture(profile.photoURL, profile.thumbnailURL);
        } catch (error) {
          console.error('Error deleting old images:', error);
        }
      }

      // Check if the photo is a local file that needs to be uploaded
      if (photoURL && photoURL.startsWith('file://')) {
        try {
          // Delete old images first if they exist
          if (profile.photoURL || profile.thumbnailURL) {
            await storageService.deleteProfilePicture(profile.photoURL, profile.thumbnailURL);
          }

          // Upload the new image to Firebase Storage and get both full and thumbnail URLs
          const uploadResult = await storageService.uploadProfilePicture(profile.id, photoURL);
          photoURL = uploadResult.fullUrl;
          thumbnailURL = uploadResult.thumbnailUrl;
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          Alert.alert('Error', 'Failed to upload profile picture');
          setIsLoading(false);
          return;
        }
      }

      // Update profile using authService with the Firebase Storage URLs
      await authService.updateProfile({
        firstName: editedProfile.firstName,
        lastName: editedProfile.lastName,
        bio: editedProfile.bio,
        photoURL: photoURL,
        thumbnailURL: thumbnailURL,
      });

      // Force update the profile state immediately to clear any cached images
      const updatedProfile = {
        ...profile,
        firstName: editedProfile.firstName,
        lastName: editedProfile.lastName,
        bio: editedProfile.bio,
        photoURL: photoURL,
        thumbnailURL: thumbnailURL,
      };

      setProfile(updatedProfile);
      setEditedProfile(updatedProfile);

      setIsEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully');

      // Reload from server to ensure consistency
      await loadUserProfile();
    } catch (error) {
      console.error('Profile save error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(profile);
    setIsEditingProfile(false);
  };

  const compressImage = async (uri: string): Promise<string> => {
    try {
      const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');

      // Get file info to check initial size
      const response = await fetch(uri);
      const blob = await response.blob();
      let initialSize = blob.size;

      console.log('Initial image size:', (initialSize / 1024 / 1024).toFixed(2), 'MB');

      // Start with high quality and reduce if needed
      let quality = 0.8;
      let compressedUri = uri;

      // Keep compressing until under 5MB or quality gets too low
      while (initialSize > 5242880 && quality > 0.1) { // 5MB = 5242880 bytes
        const result = await manipulateAsync(
          compressedUri,
          [{ resize: { width: 1920 } }], // Resize to max width 1920px
          {
            compress: quality,
            format: SaveFormat.JPEG,
          }
        );

        // Check new file size
        const newResponse = await fetch(result.uri);
        const newBlob = await newResponse.blob();
        initialSize = newBlob.size;
        compressedUri = result.uri;

        console.log('Compressed to quality', quality, 'Size:', (initialSize / 1024 / 1024).toFixed(2), 'MB');

        // Reduce quality for next iteration
        quality -= 0.1;
      }

      // Final check
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

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      try {
        setIsLoading(true);
        const compressedUri = await compressImage(asset.uri);

        setEditedProfile({
          ...editedProfile,
          photoURL: compressedUri,
          thumbnailURL: '', // Will be generated on save
        });
      } catch (error) {
        console.error('Error processing image:', error);
        Alert.alert('Image Too Large', 'Unable to compress image below 5MB. Please select a smaller image.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCameraCapture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access the camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      try {
        setIsLoading(true);
        const compressedUri = await compressImage(asset.uri);

        setEditedProfile({
          ...editedProfile,
          photoURL: compressedUri,
          thumbnailURL: '', // Will be generated on save
        });
      } catch (error) {
        console.error('Error processing image:', error);
        Alert.alert('Image Too Large', 'Unable to compress image below 5MB. Please take a photo with better lighting or closer subject.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRemoveImage = async () => {
    try {
      setIsLoading(true);

      // Delete from Firebase Storage first if there are existing images
      if (profile.photoURL || profile.thumbnailURL) {
        try {
          await storageService.deleteProfilePicture(profile.photoURL, profile.thumbnailURL);
        } catch (error) {
          console.error('Error deleting from storage:', error);
        }
      }

      // Clear the image from edited profile
      setEditedProfile({
        ...editedProfile,
        photoURL: '',
        thumbnailURL: '',
      });

      Alert.alert('Image Removed', 'Press save to update');

    } catch (error) {
      console.error('Error removing profile picture:', error);
      Alert.alert('Error', 'Failed to remove profile picture');
    } finally {
      setIsLoading(false);
    }
  };

  const showImagePickerOptions = () => {
    const options = ['Take Photo', 'Choose from Library', 'Cancel'];

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
      // For Android - reversed order (bottom to top)
      const alertOptions = [
        {
          text: 'Cancel',
          style: 'cancel' as const,
        },
        {
          text: 'Choose from Library',
          onPress: handleImagePicker,
        },
        {
          text: 'Take Photo',
          onPress: handleCameraCapture,
        },
      ];

      Alert.alert(
        'Choose an option',
        'Select how you want to set your profile picture',
        alertOptions,
        { cancelable: true }
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
          {t('settings.title')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('settings.appearance')}</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons 
                name={isDarkMode ? 'moon' : 'sunny'} 
                size={20} 
                color={currentTheme.text} 
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                  {t('settings.darkMode')}
                </Text>
                <Text style={[styles.settingDescription, { color: currentTheme.textSecondary }]}>
                  {isDarkMode ? t('settings.darkModeEnabled') : t('settings.lightModeEnabled')}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleTheme}
              trackColor={{ false: currentTheme.border, true: COLORS.primary }}
              thumbColor={isDarkMode ? 'white' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('settings.language')}</Text>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={showLanguageOptions}
          >
            <View style={styles.settingInfo}>
              <Ionicons 
                name="language" 
                size={20} 
                color={currentTheme.text} 
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                  {t('settings.changeLanguage')}
                </Text>
                <Text style={[styles.settingDescription, { color: currentTheme.textSecondary }]}>
                  {getCurrentLanguageName()}
                </Text>
              </View>
            </View>
            <View style={styles.radiusDropdown}>
              <Text style={[styles.radiusDropdownText, { color: currentTheme.text }]}>
                {getCurrentLanguageName()}
              </Text>
              <Ionicons name="chevron-down" size={16} color={currentTheme.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('settings.location')}</Text>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={showRadiusOptions}
          >
            <View style={styles.settingInfo}>
              <Ionicons 
                name="location" 
                size={20} 
                color={currentTheme.text} 
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                  {t('settings.trackingRadius')}
                </Text>
                <Text style={[styles.settingDescription, { color: currentTheme.textSecondary }]}>
                  {t('settings.connectWithin')} {trackingRadius}km
                </Text>
              </View>
            </View>
            <View style={styles.radiusDropdown}>
              <Text style={[styles.radiusDropdownText, { color: currentTheme.text }]}>
                {trackingRadius}km
              </Text>
              <Ionicons name="chevron-down" size={16} color={currentTheme.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('settings.notifications')}</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons 
                name="notifications" 
                size={20} 
                color={currentTheme.text} 
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                  {t('settings.pushNotifications')}
                </Text>
                <Text style={[styles.settingDescription, { color: currentTheme.textSecondary }]}>
                  {t('settings.receiveNotifications')}
                </Text>
              </View>
            </View>
            <Switch
              value={pushNotificationsEnabled}
              onValueChange={handleTogglePushNotifications}
              disabled={isLoading}
              trackColor={{ false: currentTheme.border, true: COLORS.primary }}
              thumbColor={pushNotificationsEnabled ? 'white' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('settings.account')}</Text>

          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={handleEditProfile}
          >
            <View style={styles.settingInfo}>
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={currentTheme.text} 
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                  {t('settings.editProfile')}
                </Text>
                <Text style={[styles.settingDescription, { color: currentTheme.textSecondary }]}>
                  {t('settings.updateProfileInfo')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => setShowChangePasswordModal(true)}
          >
            <View style={styles.settingInfo}>
              <Ionicons 
                name="key-outline" 
                size={20} 
                color={currentTheme.text} 
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                  {t('settings.changePassword')}
                </Text>
                <Text style={[styles.settingDescription, { color: currentTheme.textSecondary }]}>
                  {t('settings.updateAccountPassword')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => setShowDeleteAccountModal(true)}
          >
            <View style={styles.settingInfo}>
              <Ionicons 
                name="trash-outline" 
                size={20} 
                color={COLORS.error} 
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: COLORS.error }]}>
                  {t('settings.deleteAccount')}
                </Text>
                <Text style={[styles.settingDescription, { color: currentTheme.textSecondary }]}>
                  {t('settings.permanentlyDelete')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('settings.support')}</Text>

          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => (navigation as any).navigate('HelpSupport')}
          >
            <View style={styles.settingInfo}>
              <Ionicons 
                name="help-circle-outline" 
                size={20} 
                color={currentTheme.text} 
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                  {t('settings.helpAndSupport')}
                </Text>
                <Text style={[styles.settingDescription, { color: currentTheme.textSecondary }]}>
                  {t('settings.getHelp')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => (navigation as any).navigate('PrivacyPolicy')}
          >
            <View style={styles.settingInfo}>
              <Ionicons 
                name="shield-outline" 
                size={20} 
                color={currentTheme.text} 
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                  {t('settings.privacyPolicy')}
                </Text>
                <Text style={[styles.settingDescription, { color: currentTheme.textSecondary }]}>
                  {t('settings.viewPrivacy')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditingProfile} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
            <TouchableOpacity onPress={handleCancelEdit}>
              <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{t('settings.editProfile')}</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.modalSave}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollView style={styles.modalContent}>
            <View style={[styles.modalSection, styles.modalImageContainer]}>
              <View style={modalStyles.avatarContainer}>
                <TouchableOpacity onPress={showImagePickerOptions}>
                  {editedProfile.photoURL && editedProfile.photoURL.trim() !== '' ? (
                    <ProfileImage
                      uri={editedProfile.thumbnailURL || editedProfile.photoURL}
                      style={modalStyles.modalAvatar}
                    />
                  ) : (
                    <View style={[modalStyles.modalAvatar, modalStyles.placeholderModalAvatar, { backgroundColor: currentTheme.surface }]}>
                      <Ionicons name="person-add" size={30} color={currentTheme.textSecondary} />
                    </View>
                  )}
                </TouchableOpacity>
                {editedProfile.photoURL && editedProfile.photoURL.trim() !== '' && (
                  <TouchableOpacity
                    style={modalStyles.deleteImageButton}
                    onPress={handleRemoveImage}
                  >
                    <Ionicons name="trash" size={16} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={[modalStyles.inputLabel, { color: currentTheme.text }]}>{t('settings.firstName')}</Text>
              <View style={[modalStyles.inputContainer, {
                backgroundColor: currentTheme.surface,
                borderColor: currentTheme.border
              }]}>
                <Ionicons name="person-outline" size={20} color={currentTheme.textSecondary} />
                <TextInput
                  style={[modalStyles.input, { color: currentTheme.text }]}
                  value={editedProfile.firstName}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, firstName: text })}
                  placeholder={t('settings.enterFirstName')}
                  placeholderTextColor={currentTheme.textSecondary}
                />
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={[modalStyles.inputLabel, { color: currentTheme.text }]}>{t('settings.lastName')}</Text>
              <View style={[modalStyles.inputContainer, {
                backgroundColor: currentTheme.surface,
                borderColor: currentTheme.border
              }]}>
                <Ionicons name="person-outline" size={20} color={currentTheme.textSecondary} />
                <TextInput
                  style={[modalStyles.input, { color: currentTheme.text }]}
                  value={editedProfile.lastName}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, lastName: text })}
                  placeholder={t('settings.enterLastName')}
                  placeholderTextColor={currentTheme.textSecondary}
                />
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={[modalStyles.inputLabel, { color: currentTheme.text }]}>{t('settings.email')}</Text>
              <View style={[modalStyles.inputContainer, {
                backgroundColor: currentTheme.surface,
                borderColor: currentTheme.border
              }]}>
                <Ionicons name="mail-outline" size={20} color={currentTheme.textSecondary} />
                <View style={[modalStyles.emailDisplayContainer]}>
                  <Text style={[modalStyles.emailDisplayText, { color: currentTheme.textSecondary }]}>
                    {profile.email}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={[modalStyles.inputLabel, { color: currentTheme.text }]}>{t('settings.bio')}</Text>
              <View style={[modalStyles.inputContainer, modalStyles.textAreaContainer, {
                backgroundColor: currentTheme.surface,
                borderColor: currentTheme.border
              }]}>
                <Ionicons name="document-text-outline" size={20} color={currentTheme.textSecondary} style={modalStyles.textAreaIcon} />
                <TextInput
                  style={[modalStyles.textArea, { color: currentTheme.text }]}
                  value={editedProfile.bio}                  onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
                  placeholder={t('settings.tellUsAboutYourself')}
                  placeholderTextColor={currentTheme.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          </KeyboardAwareScrollView>
        </SafeAreaView>
      </Modal>

      {/* Language Selection Modal */}
      <Modal 
        visible={showLanguageModal} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
            <TouchableOpacity 
              onPress={() => setShowLanguageModal(false)}
              style={modalStyles.modalHeaderButton}
            >
              <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{t('settings.changeLanguage')}</Text>
            <View style={modalStyles.modalHeaderButton} />
          </View>

          <View style={modalStyles.radiusOptionsContainer}>
            <Text style={[modalStyles.radiusDescription, { color: currentTheme.textSecondary }]}>
              {t('settings.selectPreferredLanguage')}
            </Text>

            {[
              { code: 'en', name: 'English', nativeName: 'English' },
              { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski' }
            ].map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  modalStyles.radiusOption,
                  {
                    backgroundColor: i18n.language === language.code ? `${COLORS.primary}15` : currentTheme.surface,
                    borderColor: i18n.language === language.code ? COLORS.primary : currentTheme.border,
                    borderWidth: i18n.language === language.code ? 2 : 1,
                  }
                ]}
                onPress={() => changeLanguage(language.code)}
                activeOpacity={0.7}
              >
                <View style={modalStyles.radiusOptionContent}>
                  <View style={modalStyles.radiusOptionLeft}>
                    <Text style={[
                      modalStyles.radiusOptionText,
                      {
                        color: i18n.language === language.code ? COLORS.primary : currentTheme.text,
                        fontFamily: i18n.language === language.code ? FONTS.bold : FONTS.bold,
                      }
                    ]}>
                      {language.nativeName}
                    </Text>
                    <Text style={[
                      modalStyles.radiusOptionDescription,
                      { color: currentTheme.textSecondary }
                    ]}>
                      {language.name}
                    </Text>
                  </View>

                  {i18n.language === language.code && (
                    <View style={modalStyles.radiusSelectedIcon}>
                      <Ionicons name="checkmark-circle-outline" size={28} color={COLORS.primary} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Radius Selection Modal */}
      <Modal 
        visible={showRadiusModal} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRadiusModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
            <TouchableOpacity 
              onPress={() => setShowRadiusModal(false)}
              style={modalStyles.modalHeaderButton}
            >
              <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{t('settings.trackingRadius')}</Text>
            <View style={modalStyles.modalHeaderButton} />
          </View>

          <View style={modalStyles.radiusOptionsContainer}>
            <Text style={[modalStyles.radiusDescription, { color: currentTheme.textSecondary }]}>
              {t('settings.chooseConnectDistance')}
            </Text>

            {[1, 5, 10].map((radius) => (
              <TouchableOpacity
                key={radius}
                style={[
                  modalStyles.radiusOption,
                  {
                    backgroundColor: trackingRadius === radius ? `${COLORS.primary}15` : currentTheme.surface,
                    borderColor: trackingRadius === radius ? COLORS.primary : currentTheme.border,
                    borderWidth: trackingRadius === radius ? 2 : 1,
                  }
                ]}
                onPress={() => {
                  handleTrackingRadiusChange(radius);
                  setShowRadiusModal(false);
                }}
                activeOpacity={0.7}
              >
                <View style={modalStyles.radiusOptionContent}>
                  <View style={modalStyles.radiusOptionLeft}>
                    <Text style={[
                      modalStyles.radiusOptionText,
                      {
                        color: trackingRadius === radius ? COLORS.primary : currentTheme.text,
                        fontFamily: trackingRadius === radius ? FONTS.bold : FONTS.bold,
                      }
                    ]}>
                      {radius}km {t('settings.radius')}
                    </Text>
                    <Text style={[
                      modalStyles.radiusOptionDescription,
                      { color: currentTheme.textSecondary }
                    ]}>
                      {t('settings.connectWithin')} {radius} {t('settings.kilometer', { count: radius })}
                    </Text>
                  </View>

                  {trackingRadius === radius && (
                    <View style={modalStyles.radiusSelectedIcon}>
                      <Ionicons name="checkmark-circle-outline" size={28} color={COLORS.primary} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showChangePasswordModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
            <TouchableOpacity onPress={() => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setShowChangePasswordModal(false);
            }}>
              <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{t('settings.changePassword')}</Text>
            <TouchableOpacity onPress={handleChangePassword} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.modalSave}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={[modalStyles.inputLabel, { color: currentTheme.text }]}>{t('settings.currentPassword')}</Text>
              <View style={[modalStyles.inputContainer, {
                backgroundColor: currentTheme.surface,
                borderColor: currentTheme.border
              }]}>
                <Ionicons name="lock-closed-outline" size={20} color={currentTheme.textSecondary} />
                <TextInput
                  style={[modalStyles.input, { color: currentTheme.text }]}
                  placeholder={t('settings.enterCurrentPassword')}
                  placeholderTextColor={currentTheme.textSecondary}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={[modalStyles.inputLabel, { color: currentTheme.text }]}>{t('settings.newPassword')}</Text>
              <View style={[modalStyles.inputContainer, {
                backgroundColor: currentTheme.surface,
                borderColor: currentTheme.border
              }]}>
                <Ionicons name="lock-closed-outline" size={20} color={currentTheme.textSecondary} />
                <TextInput
                  style={[modalStyles.input, { color: currentTheme.text }]}
                  placeholder={t('settings.enterNewPassword')}
                  placeholderTextColor={currentTheme.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={[modalStyles.inputLabel, { color: currentTheme.text }]}>{t('settings.confirmNewPassword')}</Text>
              <View style={[modalStyles.inputContainer, {
                backgroundColor: currentTheme.surface,
                borderColor: currentTheme.border
              }]}>
                <Ionicons name="lock-closed-outline" size={20} color={currentTheme.textSecondary} />
                <TextInput
                  style={[modalStyles.input, { color: currentTheme.text }]}
                  placeholder={t('settings.confirmNewPassword')}
                  placeholderTextColor={currentTheme.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={modalStyles.passwordRequirements}>
              <Text style={[modalStyles.requirementsTitle, { color: currentTheme.text }]}>{t('settings.passwordRequirements')}:</Text>
              <Text style={[modalStyles.requirementItem, { color: currentTheme.textSecondary }]}>• {t('settings.atLeast')} 8 {t('settings.charactersLong')}</Text>
              <Text style={[modalStyles.requirementItem, { color: currentTheme.textSecondary }]}>• {t('settings.atLeastOne')} {t('settings.uppercaseLetter')} (A-Z)</Text>
              <Text style={[modalStyles.requirementItem, { color: currentTheme.textSecondary }]}>• {t('settings.atLeastOne')} {t('settings.lowercaseLetter')} (a-z)</Text>
              <Text style={[modalStyles.requirementItem, { color: currentTheme.textSecondary }]}>• {t('settings.atLeastOne')} {t('settings.number')} (0-9)</Text>
              <Text style={[modalStyles.requirementItem, { color: currentTheme.textSecondary }]}>• {t('settings.atLeastOne')} {t('settings.specialCharacter')} (!@#$%^&*)</Text>
            </View>
          </KeyboardAwareScrollView>
        </SafeAreaView>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={showDeleteAccountModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
            <TouchableOpacity onPress={() => setShowDeleteAccountModal(false)}>
              <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{t('settings.deleteAccount')}</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={modalStyles.warningSection}>
              <View style={[modalStyles.warningIconContainer, { backgroundColor: `${COLORS.error}15` }]}>
                <Ionicons name="warning" size={48} color={COLORS.error} />
              </View>
              <Text style={[modalStyles.warningTitle, { color: COLORS.error }]}>{t('settings.thisActionIsPermanent')}</Text>
              <Text style={[modalStyles.warningText, { color: currentTheme.text }]}>
                {t('settings.deletingAccountRemovesData')}
              </Text>

              <View style={[modalStyles.listContainer, { backgroundColor: currentTheme.surface }]}>
                <View style={modalStyles.listItem}>
                  <Ionicons name="person-outline" size={16} color={currentTheme.textSecondary} />
                  <Text style={[modalStyles.listItemText, { color: currentTheme.textSecondary }]}>{t('settings.yourProfileInfo')}</Text>
                </View>
                <View style={modalStyles.listItem}>
                  <Ionicons name="document-text-outline" size={16} color={currentTheme.textSecondary} />
                  <Text style={[modalStyles.listItemText, { color: currentTheme.textSecondary }]}>{t('settings.yourPostsAndComments')}</Text>
                </View>
                <View style={modalStyles.listItem}>
                  <Ionicons name="chatbubbles-outline" size={16} color={currentTheme.textSecondary} />
                  <Text style={[modalStyles.listItemText, { color: currentTheme.textSecondary }]}>{t('settings.yourChatHistory')}</Text>
                </View>
                <View style={[modalStyles.listItem, { borderBottomWidth: 0 }]}>
                  <Ionicons name="people-outline" size={16} color={currentTheme.textSecondary} />
                  <Text style={[modalStyles.listItemText, { color: currentTheme.textSecondary }]}>{t('settings.yourConnectionsAndFollowers')}</Text>
                </View>
              </View>

              <View style={[modalStyles.cautionBox, { backgroundColor: `${COLORS.error}08`, borderColor: `${COLORS.error}40` }]}>
                <Ionicons name="alert-circle-outline" size={20} color={COLORS.error} />
                <Text style={[modalStyles.cautionText, { color: currentTheme.text }]}>
                  {t('settings.thisActionCannotBeUndone')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[modalStyles.deleteButton, { opacity: isLoading ? 0.7 : 1 }]}
              onPress={handleDeleteAccount}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color="white" />
                  <Text style={modalStyles.deleteButtonText}>{t('settings.deleteMyAccount')}</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const ProfileImage = React.memo(({ uri, style, ...props }: { uri: string; style: any; [key: string]: any }) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  // Get proper width value for shimmer effect
  const imageWidth = typeof style?.width === 'number' ? style.width : 100;
  const imageHeight = typeof style?.height === 'number' ? style.height : 100;

  React.useEffect(() => {
    setLoading(true);
    setError(false);
  }, [uri]);

  return (
    <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
      {loading && !error && (
        <SkeletonLoader
          width={imageWidth}
          height={imageHeight}
          borderRadius={style?.borderRadius || 50}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        />
      )}
      <Image
        source={{ uri, cache: 'reload' }}
        style={[style, { opacity: loading ? 0 : 1 }]}
        onLoadStart={() => {
          setLoading(true);
          setError(false);
        }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        {...props}
      />
    </View>
  );
});

const lightTheme = {
  background: COLORS.background,
  surface: COLORS.surface,
  text: COLORS.text,
  textSecondary: COLORS.textSecondary,
  border: COLORS.border,
};

const darkTheme = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  content: {
    flex: 1,
    paddingTop: SPACING.md,
  },
  section: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 12,
    paddingVertical: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: SPACING.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  radiusDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  radiusDropdownText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  modalSave: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  modalSection: {
    marginVertical: SPACING.md,
  },
  modalImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.lg,
  },
});

const modalStyles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  placeholderModalAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.error,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
  },
  input: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.sm,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  emailDisplayContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  emailDisplayText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    minHeight: 120,
  },
  textAreaIcon: {
    marginTop: SPACING.xs,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: SPACING.md,
    resizeMode: 'cover',
  },
  modalHeaderButton: {
    minWidth: 60,
    alignItems: 'center',
  },
  radiusOptionsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    gap: SPACING.md,
    flex: 1,
  },
  radiusDescription: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  radiusOption: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  radiusOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  radiusOptionLeft: {
    flex: 1,
  },
  radiusOptionText: {
    fontSize: 18,
    marginBottom: SPACING.xs,
  },
  radiusOptionDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  radiusSelectedIcon: {
    marginLeft: SPACING.md,
  },
  passwordRequirements: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
  },
  requirementsTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
  },
  requirementItem: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  warningSection: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  warningIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  warningTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  listContainer: {
    alignSelf: 'stretch',
    borderRadius: 12,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  listItemText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 20,
  },
  cautionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.xl,
    alignSelf: 'stretch',
  },
  cautionText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: SPACING.xl,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.sm,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  languageButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});