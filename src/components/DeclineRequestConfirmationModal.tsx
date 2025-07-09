
import React from 'react';
import { View, Text, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/DeclineRequestConfirmationModalStyles';

interface DeclineRequestConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  currentTheme: any;
  userName?: string;
  animation?: Animated.Value;
}

export default function DeclineRequestConfirmationModal({
  visible,
  onConfirm,
  onCancel,
  currentTheme,
  userName,
  animation,
}: DeclineRequestConfirmationModalProps) {
  const { t } = useTranslation();
  const animatedStyle = animation ? {
    transform: [
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
    opacity: animation,
  } : {};

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType={animation ? "none" : "fade"}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.confirmationModal,
            {
              backgroundColor: currentTheme.surface,
            },
            animatedStyle,
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons 
              name="close-circle" 
              size={50} 
              color={COLORS.error} 
            />
          </View>

          <Text style={[styles.title, { color: currentTheme.text }]}>
            {t('chats.declineRequest')}
          </Text>

          <Text style={[styles.message, { color: currentTheme.textSecondary }]}>
            {userName ? 
              t('chats.declineRequestMessage', `Are you sure you want to decline the request from ${userName}?`).replace('{{user}}', userName) :
              t('chats.declineRequestConfirmation', 'Are you sure you want to decline this request?')
            }
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: currentTheme.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelButtonText, { color: currentTheme.textSecondary }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { backgroundColor: COLORS.error }]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>
                {t('common.decline', 'Decline')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
