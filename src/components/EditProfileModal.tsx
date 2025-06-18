
import React from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../config/constants';
import { styles, modalStyles } from '../styles/SettingsStyles';
import ProfileImage from './ProfileImage';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  thumbnailURL: string;
  bio: string;
}

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  currentTheme: any;
  isLoading: boolean;
  editedProfile: UserProfile;
  setEditedProfile: (profile: UserProfile) => void;
  onImagePicker: () => void;
  onRemoveImage: () => void;
  profile: UserProfile | null;
}

export default function EditProfileModal({
  visible,
  onClose,
  onSave,
  currentTheme,
  isLoading,
  editedProfile,
  setEditedProfile,
  onImagePicker,
  onRemoveImage,
  profile,
}: EditProfileModalProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{t('settings.editProfile')}</Text>
          <TouchableOpacity onPress={onSave} disabled={isLoading}>
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
              <TouchableOpacity onPress={onImagePicker}>
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
                  onPress={onRemoveImage}
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
  );
}
