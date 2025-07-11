import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../config/constants';
import { styles } from '../styles/SettingsStyles';
import { modalStyles } from '../styles/SettingsStyles';
import { authService } from '../services/auth';
import ChangePasswordSuccessModal from './ChangePasswordSuccessModal';

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successAnimation] = useState(new Animated.Value(0));

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    onClose();
  };

  const handleSuccessModalClose = () => {
    Animated.timing(successAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccess(false);
      onClose();
    });
  };

  const validatePassword = (password: string): boolean => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  };

  const handleSave = async () => {
    setError(null);

    if (!currentPassword.trim()) {
      setError(t('settings.currentPasswordRequired'));
      return;
    }

    if (!newPassword.trim()) {
      setError(t('settings.newPasswordRequired'));
      return;
    }

    if (!confirmPassword.trim()) {
      setError(t('settings.confirmPasswordRequired'));
      return;
    }

    if (!validatePassword(newPassword)) {
      setError(t('settings.passwordRequirementsNotMet'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('settings.passwordsDoNotMatch'));
      return;
    }

    if (currentPassword === newPassword) {
      setError(t('settings.newPasswordMustBeDifferent'));
      return;
    }

    try {
      setIsLoading(true);
      await authService.changePassword(currentPassword, newPassword);

      // Show success modal with animation
      setShowSuccess(true);
      Animated.timing(successAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error: any) {
      console.error('Change password error:', error);

      if (error.message.includes('Current password is incorrect') || 
          error.message.includes('wrong-password') ||
          error.message.includes('invalid-credential')) {
        setError(t('settings.currentPasswordIncorrect'));
      } else if (error.message.includes('weak-password')) {
        setError(t('settings.passwordTooWeak'));
      } else if (error.message.includes('recent login')) {
        setError(t('settings.recentLoginRequired'));
      } else {
        setError(t('settings.failedToChangePassword'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
            <TouchableOpacity onPress={handleClose} disabled={isLoading || showSuccess}>
              <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{t('settings.changePassword')}</Text>
            <TouchableOpacity onPress={handleSave} disabled={isLoading || showSuccess}>
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.modalSave}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollView style={styles.modalContent}>
            {error && (
              <View style={[modalStyles.errorContainer, { backgroundColor: `${COLORS.error}15`, borderColor: COLORS.error }]}>
                <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                <Text style={[modalStyles.errorText, { color: COLORS.error }]}>{error}</Text>
              </View>
            )}

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
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    setError(null);
                  }}
                  secureTextEntry
                  editable={!isLoading}
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
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setError(null);
                  }}
                  secureTextEntry
                  editable={!isLoading}
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
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setError(null);
                  }}
                  secureTextEntry
                  editable={!isLoading}
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
      <ChangePasswordSuccessModal
        visible={showSuccess}
        onClose={handleSuccessModalClose}
        currentTheme={currentTheme}
        successAnimation={successAnimation}
      />
    </>
  );
}