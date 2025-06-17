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

  const showDeleteAccountModal = () => {
    setShowDeleteAccountModal(true);
  }

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

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
            onValueChange={(value) => handleTogglePushNotifications(value, setPushNotificationsEnabled, setIsLoading, t)}
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
            onPress={() => setShowDeleteAccountModal(true)}
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
                <TouchableOpacity onPress={() => showImagePickerOptions(
                  () => handleCameraCapture(editedProfile, setEditedProfile, setIsLoading, t),
                  () => handleImagePicker(editedProfile, setEditedProfile, setIsLoading, t),
                  t
                )}>
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
                    {profile?.email || ''}
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
                  value={editedProfile.bio}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
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
                onPress={() => changeLanguage(language.code, i18n, setShowLanguageModal)}
                activeOpacity={0.7}
              >
                <View style={modalStyles.radiusOptionContent}>
                  <View style={modalStyles.radiusOptionLeft}>
                    <Text style={[
                      modalStyles.radiusOptionText,
                      {
                        color: i18n.language === language.code ? COLORS.primary : currentTheme.text,
                        fontFamily: 'System',
                        fontWeight: 'bold',
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
                  handleTrackingRadiusChange(radius, setTrackingRadius, t);
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
                        fontFamily: 'System',
                        fontWeight: 'bold',
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
    </SafeAreaView>
  );
}

const ProfileImage = React.memo(({ uri, style, ...props }: { uri: string; style: any; [key: string]: any }) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

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