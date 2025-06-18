import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { toggleTheme } from '../store/themeSlice';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../config/constants';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { fetchUserProfile, updateProfile } from '../store/userSlice';
import { authService } from '../services/auth';
import { storageService, Settings } from '../services/storage';
import SkeletonLoader from '../components/SkeletonLoader';
import SettingsSkeleton from '../components/SettingsSkeleton';
import SettingsHeader from '../components/SettingsHeader';
import SettingsSection from '../components/SettingsSection';
import SettingsToggleRow from '../components/SettingsToggleRow';
import SettingsActionRow from '../components/SettingsActionRow';
import PushNotificationModal from '../components/PushNotificationModal';
import EditProfileModal from '../components/EditProfileModal';
import LanguageSelectionModal from '../components/LanguageSelectionModal';
import RadiusSelectionModal from '../components/RadiusSelectionModal';
import ProfileImage from '../components/ProfileImage';
import { styles, modalStyles, lightTheme, darkTheme } from '../styles/SettingsStyles';
import {
  UserProfile,
  loadSettings,
  loadUserData,
  handleTogglePushNotifications,
  handleToggleLocationTracking,
  handleTrackingRadiusChange,
  handleChangePassword,
  handleDeleteAccount,
  handleImagePicker,
  handleCameraCapture,
  showImagePickerOptions,
  getCurrentLanguageName,
  changeLanguage,
} from '../utils/settingsUtils';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.user.profile);

  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [trackingRadius, setTrackingRadius] = useState(1);
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showRadiusModal, setShowRadiusModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showPushNotificationModal, setShowPushNotificationModal] = useState(false);
  const [showSettingsOption, setShowSettingsOption] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    photoURL: '',
    thumbnailURL: '',
    bio: '',
  });

  const settings = new Settings();
  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  if (loading) {
    return <SettingsSkeleton />;
  }

  useEffect(() => {
    loadSettings(setPushNotificationsEnabled, setTrackingRadius, setLocationTrackingEnabled);
    loadUserData(setEditedProfile, setIsLoading);
  }, []);

  const handleToggleTheme = async () => {
    const newValue = !isDarkMode;
    dispatch(toggleTheme());
    await settings.setDarkMode(newValue);
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
      Alert.alert(t('common.success'), t('settings.profileUpdatedSuccessfully'));

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

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const showDeleteAccountModalHandler = () => {
    setShowDeleteAccountModal(true);
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
            title={t('settings.darkMode')}
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
            description={`${t('settings.connectWithin')} ${trackingRadius}km`}
            value={`${trackingRadius}km`}
            onPress={showRadiusOptions}
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

        <SettingsSection title={t('settings.support')} currentTheme={currentTheme}>
          <SettingsActionRow
            icon="help-circle-outline"
            title={t('settings.helpAndSupport')}
            description={t('settings.getHelp')}
            onPress={() => (navigation as any).navigate('HelpSupport')}
            currentTheme={currentTheme}
          />

          <SettingsActionRow
            icon="shield-outline"
            title={t('settings.privacyPolicy')}
            description={t('settings.viewPrivacy')}
            onPress={() => (navigation as any).navigate('PrivacyPolicy')}
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
        onLanguageChange={(code) => changeLanguage(code, i18n, setShowLanguageModal)}
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
            <TouchableOpacity onPress={() => handleChangePassword(
              currentPassword,
              newPassword,
              confirmPassword,
              setCurrentPassword,
              setNewPassword,
              setConfirmPassword,
              setShowChangePasswordModal,
              setIsLoading,
              t
            )} disabled={isLoading}>
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
              onPress={() => handleDeleteAccount(setShowDeleteAccountModal, setIsLoading, t)}
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

      {/* Push Notification Permission Modal */}
      <PushNotificationModal
        visible={showPushNotificationModal}
        onClose={() => setShowPushNotificationModal(false)}
        currentTheme={currentTheme}
        isLoading={isLoading}
      />
    </SafeAreaView>
  );
}

