
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      // Add change password logic here
      Alert.alert('Success', 'Password changed successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    navigation.goBack();
  };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Change Password</Text>
          <TouchableOpacity onPress={handleChangePassword} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.modalSave}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAwareScrollView style={styles.modalContent}>
          <View style={styles.modalSection}>
            <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Current Password</Text>
            <View style={[styles.inputContainer, {
              backgroundColor: currentTheme.surface,
              borderColor: currentTheme.border
            }]}>
              <Ionicons name="lock-closed-outline" size={20} color={currentTheme.textSecondary} />
              <TextInput
                style={[styles.input, { color: currentTheme.text }]}
                placeholder="Enter current password"
                placeholderTextColor={currentTheme.textSecondary}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.modalSection}>
            <Text style={[styles.inputLabel, { color: currentTheme.text }]}>New Password</Text>
            <View style={[styles.inputContainer, {
              backgroundColor: currentTheme.surface,
              borderColor: currentTheme.border
            }]}>
              <Ionicons name="lock-closed-outline" size={20} color={currentTheme.textSecondary} />
              <TextInput
                style={[styles.input, { color: currentTheme.text }]}
                placeholder="Enter new password"
                placeholderTextColor={currentTheme.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.modalSection}>
            <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Confirm New Password</Text>
            <View style={[styles.inputContainer, {
              backgroundColor: currentTheme.surface,
              borderColor: currentTheme.border
            }]}>
              <Ionicons name="lock-closed-outline" size={20} color={currentTheme.textSecondary} />
              <TextInput
                style={[styles.input, { color: currentTheme.text }]}
                placeholder="Confirm new password"
                placeholderTextColor={currentTheme.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.passwordRequirements}>
            <Text style={[styles.requirementsTitle, { color: currentTheme.text }]}>Password Requirements:</Text>
            <Text style={[styles.requirementItem, { color: currentTheme.textSecondary }]}>• At least 6 characters long</Text>
            <Text style={[styles.requirementItem, { color: currentTheme.textSecondary }]}>• Must be different from current password</Text>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </Modal>
  );
}

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
  inputLabel: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 16,
    fontFamily: FONTS.regular,
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
});
