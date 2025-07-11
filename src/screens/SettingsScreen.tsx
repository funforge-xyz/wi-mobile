import { useState, useEffect } from 'react';
import {
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { toggleTheme } from '../store/themeSlice';
import { setLanguage } from '../store/languageSlice';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../config/constants';
import { fetchUserProfile, updateProfile } from '../store/userSlice';
import { authService } from '../services/auth';
import { storageService, Settings } from '../services/storage';
import SettingsSkeleton from '../components/SettingsSkeleton';
import SettingsHeader from '../components/SettingsHeader';
import SettingsSection from '../components/SettingsSection';
import SettingsToggleRow from '../components/SettingsToggleRow';
import SettingsActionRow from '../components/SettingsActionRow';
import PushNotificationModal from '../components/PushNotificationModal';
import EditProfileModal from '../components/EditProfileModal';
import LanguageSelectionModal from '../components/LanguageSelectionModal';
import RadiusSelectionModal from '../components/RadiusSelectionModal';
import ChangePasswordModal from '../components/ChangePasswordModal';

import { styles } from '../styles/SettingsStyles';
import { getTheme } from '../theme';
import {
  UserProfile,
  loadSettings,
  loadUserData,
  handleTogglePushNotifications,
  handleToggleLocationTracking,
  handleToggleSameNetworkMatching,
  handleTrackingRadiusChange,
  handleChangePassword,
  handleImagePicker,
  handleCameraCapture,
  showImagePickerOptions,
  getCurrentLanguageName,
  changeLanguage,
} from '../utils/settingsUtils';
import { useNetworkMonitoring } from '../hooks/useNetworkMonitoring';
import ProfileEditSuccessModal from '../components/ProfileEditSuccessModal';
import { useDataRefresh } from '../hooks/useDataRefresh';
import { loadProfile } from '../utils/profileUtils';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.user.profile);

  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [trackingRadius, setTrackingRadius] = useState(0.1);
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(false);
  const [sameNetworkMatchingEnabled, setSameNetworkMatchingEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showRadiusModal, setShowRadiusModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showPushNotificationModal, setShowPushNotificationModal] = useState(false);
  const [showSettingsOption, setShowSettingsOption] = useState(false);
  
  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    photoURL: '',
    thumbnailURL: '',
    bio: '',
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successAnimation] = useState(new Animated.Value(0));

  // Network monitoring state
  const { 
    wifiInfo, 
    isNetworkMonitoring, 
    startNetworkMonitoring, 
    stopNetworkMonitoring,
    networkQuality 
  } = useNetworkMonitoring();
  const [realTimeNetworkEnabled, setRealTimeNetworkEnabled] = useState(false);

  const settings = new Settings();
  const currentTheme = getTheme(isDarkMode);

  // Computed network status
  const currentNetworkStatus = wifiInfo ? 
    `${wifiInfo.ssid || t('settings.unknownNetwork')} (${networkQuality})` : 
    t('settings.notConnected');

  if (loading) {
    return <SettingsSkeleton />;
  }

  useEffect(() => {
    loadSettings(setPushNotificationsEnabled, setTrackingRadius, setLocationTrackingEnabled, setSameNetworkMatchingEnabled);
    loadUserData(setEditedProfile, setIsLoading);
  }, []);

  useDataRefresh({
    fetchData: () => loadProfile(dispatch, profile),
    lastFetch: profile?.lastUpdated || 0,
    refreshThreshold: 5 * 60 * 1000 // 5 minutes
  });

  const showSuccessModalWithAnimation = () => {
    setShowSuccessModal(true);
    Animated.spring(successAnimation, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const hideSuccessModal = () => {
    Animated.spring(successAnimation, {
      toValue: 0,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccessModal(false);
    });
  };

  const handleToggleTheme = async () => {
    try {
      const newDarkMode = !isDarkMode;

      // Save to AsyncStorage first
      const { SettingsService } = await import('../services/settings');
      const settingsService = SettingsService.getInstance();
      await settingsService.setDarkMode(newDarkMode);

      // Then update Redux state
      dispatch(toggleTheme());

      console.log('Theme preference saved and applied:', newDarkMode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const handleEditProfile = () => {
    setEditedProfile(profile || {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      photoURL: '',
      thumbnailURL: '',
      bio: '',
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);

      if (!profile) return;

      let photoURL = editedProfile.photoURL;
      let thumbnailURL = editedProfile.thumbnailURL;

      if (!photoURL && (profile.photoURL || profile.thumbnailURL)) {
        try {
          await storageService.deleteProfilePicture(profile.photoURL, profile.thumbnailURL);
        } catch (error) {
          console.error('Error deleting old images:', error);
        }
      }

      if (photoURL && photoURL.startsWith('file://')) {
        try {
          if (profile.photoURL || profile.thumbnailURL) {
            await storageService.deleteProfilePicture(profile.photoURL, profile.thumbnailURL);
          }

          const uploadResult = await storageService.uploadProfilePicture(profile.id, photoURL);
          photoURL = uploadResult.fullUrl;
          thumbnailURL = uploadResult.thumbnailUrl;
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          Alert.alert(t('common.error'), t('settings.failedToUploadProfilePicture'));
          setIsLoading(false);
          return;
        }
      }

      await authService.updateProfile({
        firstName: editedProfile.firstName,
        lastName: editedProfile.lastName,
        bio: editedProfile.bio,
        photoURL: photoURL,
        thumbnailURL: thumbnailURL,
      });

      dispatch(updateProfile({
        firstName: editedProfile.firstName,
        lastName: editedProfile.lastName,
        bio: editedProfile.bio,
        photoURL: photoURL,
        thumbnailURL: thumbnailURL,
      }));

      setIsEditingProfile(false);
      // Alert.alert(t('common.success'), t('settings.profileUpdatedSuccessfully'));
      showSuccessModalWithAnimation();

      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        dispatch(fetchUserProfile(currentUser.uid));
      }
    } catch (error) {
      console.error('Profile save error:', error);
      Alert.alert(t('common.error'), t('settings.failedToUpdateProfile'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(profile || {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      photoURL: '',
      thumbnailURL: '',
      bio: '',
    });
    setIsEditingProfile(false);
  };

  const handleRemoveImage = async () => {
    try {
      setIsLoading(true);

      if (profile?.photoURL || profile?.thumbnailURL) {
        try {
          await storageService.deleteProfilePicture(profile.photoURL, profile.thumbnailURL);
        } catch (error) {
          console.error('Error deleting from storage:', error);
        }
      }

      setEditedProfile({
        ...editedProfile,
        photoURL: '',
        thumbnailURL: '',
      });

      Alert.alert(t('settings.imageRemoved'), t('settings.pressSaveToUpdate'));

    } catch (error) {
      console.error('Error removing profile picture:', error);
      Alert.alert(t('common.error'), t('settings.failedToRemoveProfilePicture'));
    } finally {
      setIsLoading(false);
    }
  };

  const showRadiusOptions = () => {
    setShowRadiusModal(true);
  };

  const showLanguageOptions = () => {
    setShowLanguageModal(true);
  };

  const showDeleteAccountModalHandler = () => {
    navigation.navigate('DeleteAccount');
  };

  const showNetworkInfo = () => {
    Alert.alert(
      t('settings.networkInformation'),
      `${t('settings.ssid')}: ${wifiInfo?.ssid || t('settings.unavailable')}\n${t('settings.bssid')}: ${wifiInfo?.bssid || t('settings.unavailable')}\n${t('settings.ipAddress')}: ${wifiInfo?.ipAddress || t('settings.unavailable')}\n${t('settings.networkQuality')}: ${networkQuality}`
    );
  };

  const handleToggleRealTimeNetwork = (value: boolean, setRealTimeNetworkEnabled: (value: boolean) => void, setIsLoading: (value: boolean) => void, t: any) => {
    setIsLoading(true);
    if (value) {
      startNetworkMonitoring();
      setRealTimeNetworkEnabled(true);
      Alert.alert(t('settings.realTimeNetworkEnabled'), t('settings.realTimeNetworkEnabledDescription'));
    } else {
      stopNetworkMonitoring();
      setRealTimeNetworkEnabled(false);
      Alert.alert(t('settings.realTimeNetworkDisabled'), t('settings.realTimeNetworkDisabledDescription'));
    }
    setIsLoading(false);
  };



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <SettingsHeader
        onBackPress={() => navigation.goBack()}
        currentTheme={currentTheme}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection title={t('settings.appearance')} currentTheme={currentTheme}>
          <SettingsToggleRow
            icon={isDarkMode ? 'moon' : 'sunny'}
            title={isDarkMode ? t('settings.darkMode') : t('settings.lightMode')}
            description={isDarkMode ? t('settings.darkModeEnabled') : t('settings.lightModeEnabled')}
            value={isDarkMode}
            onValueChange={handleToggleTheme}
            currentTheme={currentTheme}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.language')} currentTheme={currentTheme}>
          <SettingsActionRow
            icon="language"
            title={t('settings.changeLanguage')}
            description={getCurrentLanguageName(i18n.language)}
            value={getCurrentLanguageName(i18n.language)}
            onPress={showLanguageOptions}
            currentTheme={currentTheme}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.location')} currentTheme={currentTheme}>
          <SettingsToggleRow
            icon="location"
            title={t('settings.locationTracking')}
            description={t('settings.enableBackgroundLocation')}
            value={locationTrackingEnabled}
            onValueChange={(value) => handleToggleLocationTracking(value, setLocationTrackingEnabled, setIsLoading, t)}
            disabled={isLoading}
            currentTheme={currentTheme}
          />

          <SettingsActionRow
            icon="navigate"
            title={t('settings.trackingRadius')}
            description={`${t('settings.connectWithin')} ${trackingRadius * 1000} ${t('settings.meters')}`}
            value={`${trackingRadius * 1000}m`}
            onPress={showRadiusOptions}
            currentTheme={currentTheme}
          />

          <SettingsToggleRow
            icon="wifi"
            title={t('settings.sameNetworkMatching')}
            description={sameNetworkMatchingEnabled ? t('settings.sameNetworkMatchingEnabled') : t('settings.sameNetworkMatchingDisabled')}
            value={sameNetworkMatchingEnabled}
            onValueChange={(value) => handleToggleSameNetworkMatching(value, setSameNetworkMatchingEnabled, setIsLoading, t)}
            disabled={isLoading}
            currentTheme={currentTheme}
          />



          <SettingsToggleRow
            icon="refresh"
            title={t('settings.realTimeNetworkMonitoring')}
            description={t('settings.realTimeNetworkDescription')}
            value={realTimeNetworkEnabled}
            onValueChange={(value) => handleToggleRealTimeNetwork(value, setRealTimeNetworkEnabled, setIsLoading, t)}
            disabled={isLoading}
            currentTheme={currentTheme}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.notifications')} currentTheme={currentTheme}>
          <SettingsToggleRow
            icon="notifications"
            title={t('settings.pushNotifications')}
            description={t('settings.receiveNotifications')}
            value={pushNotificationsEnabled}
            onValueChange={(value) => handleTogglePushNotifications(value, setPushNotificationsEnabled, setIsLoading, t, setShowPushNotificationModal, setShowSettingsOption)}
            disabled={isLoading}
            currentTheme={currentTheme}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.account')} currentTheme={currentTheme}>
          <SettingsActionRow
            icon="person-outline"
            title={t('settings.editProfile')}
            description={t('settings.updateProfileInfo')}
            onPress={handleEditProfile}
            currentTheme={currentTheme}
          />

          <SettingsActionRow
            icon="key-outline"
            title={t('settings.changePassword')}
            description={t('settings.updateAccountPassword')}
            onPress={() => setShowChangePasswordModal(true)}
            currentTheme={currentTheme}
          />

          <SettingsActionRow
            icon="trash-outline"
            title={t('settings.deleteAccount')}
            description={t('settings.permanentlyDelete')}
            onPress={showDeleteAccountModalHandler}
            iconColor={COLORS.error}
            titleColor={COLORS.error}
            currentTheme={currentTheme}
          />
        </SettingsSection>


      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={isEditingProfile}
        onClose={handleCancelEdit}
        onSave={handleSaveProfile}
        currentTheme={currentTheme}
        isLoading={isLoading}
        editedProfile={editedProfile}
        setEditedProfile={setEditedProfile}
        onImagePicker={() => showImagePickerOptions(
          () => handleCameraCapture(editedProfile, setEditedProfile, setIsLoading, t),
          () => handleImagePicker(editedProfile, setEditedProfile, setIsLoading, t),
          t
        )}
        onRemoveImage={handleRemoveImage}
        profile={profile}
      />

      {/* Language Selection Modal */}
      <LanguageSelectionModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        currentTheme={currentTheme}
        onLanguageChange={(code) => {
          // Update Redux state first
          dispatch(setLanguage(code));
          // Then handle the language change with Firebase storage
          changeLanguage(code, i18n, setShowLanguageModal);
        }}
        currentLanguage={i18n.language}
      />

      {/* Radius Selection Modal */}
      <RadiusSelectionModal
        visible={showRadiusModal}
        onClose={() => setShowRadiusModal(false)}
        currentTheme={currentTheme}
        trackingRadius={trackingRadius}
        onRadiusChange={(radius) => handleTrackingRadiusChange(radius, setTrackingRadius, t)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        currentTheme={currentTheme}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />

      

      {/* Push Notification Permission Modal */}
      <PushNotificationModal
        visible={showPushNotificationModal}
        onClose={() => setShowPushNotificationModal(false)}
        currentTheme={currentTheme}
        isLoading={isLoading}
      />

      <ProfileEditSuccessModal
        visible={showSuccessModal}
        onClose={hideSuccessModal}
        animation={successAnimation}
        currentTheme={currentTheme}
      />
    </SafeAreaView>
  );
}