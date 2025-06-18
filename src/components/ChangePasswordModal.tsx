
import { useState } from 'react';
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
import { handleChangePassword } from '../utils/settingsUtils';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  currentTheme: any;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function ChangePasswordModal({
  visible,
  onClose,
  currentTheme,
  isLoading,
  setIsLoading,
}: ChangePasswordModalProps) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  const handleSave = () => {
    handleChangePassword(
      currentPassword,
      newPassword,
      confirmPassword,
      setCurrentPassword,
      setNewPassword,
      setConfirmPassword,
      handleClose,
      setIsLoading,
      t
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{t('settings.changePassword')}</Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading}>
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
  );
}
