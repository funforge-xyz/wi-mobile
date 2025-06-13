
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector } from '../hooks/redux';

export default function DeleteAccountScreen() {
  const navigation = useNavigation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const [isLoading, setIsLoading] = useState(false);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

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
              // Navigation will be handled by the auth service callback
              // No need to manually navigate since the auth state change will trigger it
            } catch (error: any) {
              Alert.alert('Error', error.message);
              setIsLoading(false); // Only reset loading on error
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Delete Account</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.warningSection}>
            <View style={[styles.warningIconContainer, { backgroundColor: `${COLORS.error}15` }]}>
              <Ionicons name="warning" size={48} color={COLORS.error} />
            </View>
            <Text style={[styles.warningTitle, { color: COLORS.error }]}>This action is permanent</Text>
            <Text style={[styles.warningText, { color: currentTheme.text }]}>
              Deleting your account will permanently remove all your data, including:
            </Text>

            <View style={[styles.listContainer, { backgroundColor: currentTheme.surface }]}>
              <View style={styles.listItem}>
                <Ionicons name="person-outline" size={16} color={currentTheme.textSecondary} />
                <Text style={[styles.listItemText, { color: currentTheme.textSecondary }]}>Your profile information</Text>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="document-text-outline" size={16} color={currentTheme.textSecondary} />
                <Text style={[styles.listItemText, { color: currentTheme.textSecondary }]}>All your posts and comments</Text>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="chatbubbles-outline" size={16} color={currentTheme.textSecondary} />
                <Text style={[styles.listItemText, { color: currentTheme.textSecondary }]}>Your chat history</Text>
              </View>
              <View style={[styles.listItem, { borderBottomWidth: 0 }]}>
                <Ionicons name="people-outline" size={16} color={currentTheme.textSecondary} />
                <Text style={[styles.listItemText, { color: currentTheme.textSecondary }]}>Your connections and followers</Text>
              </View>
            </View>

            <View style={[styles.cautionBox, { backgroundColor: `${COLORS.error}08`, borderColor: `${COLORS.error}40` }]}>
              <Ionicons name="alert-circle-outline" size={20} color={COLORS.error} />
              <Text style={[styles.cautionText, { color: currentTheme.text }]}>
                This action cannot be undone. Make sure you want to permanently delete your account before proceeding.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.deleteButton, { opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleDeleteAccount}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="white" />
                <Text style={styles.deleteButtonText}>Delete My Account</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
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
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.md,
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
});
