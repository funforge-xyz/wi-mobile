
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../config/constants';
import { styles, modalStyles } from '../styles/SettingsStyles';
import { authService } from '../services/auth';
import ConfirmationModal from './ConfirmationModal';
import SuccessModal from './SuccessModal';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  currentTheme: any;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function DeleteAccountModal({
  visible,
  onClose,
  currentTheme,
  isLoading,
  setIsLoading,
}: DeleteAccountModalProps) {
  const { t } = useTranslation();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const confirmAnimation = useRef(new Animated.Value(0)).current;
  const successAnimation = useRef(new Animated.Value(0)).current;

  const handleDeletePress = () => {
    setShowConfirmModal(true);
    Animated.spring(confirmAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleCancelConfirm = () => {
    Animated.spring(confirmAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setShowConfirmModal(false);
    });
  };

  const handleConfirmDelete = async () => {
    // Hide confirmation modal first
    Animated.spring(confirmAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setShowConfirmModal(false);
    });

    setIsLoading(true);
    
    try {
      await authService.deleteProfile();
      
      setIsLoading(false);
      setShowSuccessModal(true);
      
      Animated.spring(successAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Auto-close after 2 seconds
      setTimeout(() => {
        Animated.spring(successAnimation, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start(() => {
          setShowSuccessModal(false);
          onClose();
        });
      }, 2000);
      
    } catch (error: any) {
      setIsLoading(false);
      // You might want to show an error modal here instead of alert
      console.error('Delete account error:', error.message);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
            <TouchableOpacity onPress={onClose}>
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
              onPress={handleDeletePress}
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showConfirmModal}
        title={t('settings.deleteAccount')}
        message={t('settings.areYouSureYouWantToDeleteAccount')}
        confirmText={t('settings.delete')}
        cancelText={t('common.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelConfirm}
        currentTheme={currentTheme}
        isDestructive={true}
        animation={confirmAnimation}
      />

      {/* Loading/Success Modal */}
      <SuccessModal
        visible={isLoading || showSuccessModal}
        title={isLoading ? t('settings.deletingAccount') : t('settings.accountDeleted')}
        message={isLoading ? t('settings.pleaseWait') : t('settings.accountDeletedSuccessfully')}
        animation={isLoading ? new Animated.Value(1) : successAnimation}
        currentTheme={currentTheme}
        isLoading={isLoading}
      />
    </>
  );
}
