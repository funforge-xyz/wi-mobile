
import React, { useEffect } from 'react';
import { Modal, View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../config/constants';
import { styles } from '../styles/ResetPasswordSuccessModalStyles';

interface ChangePasswordSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  animation: Animated.Value;
  currentTheme: {
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
}

export default function ChangePasswordSuccessModal({
  visible,
  onClose,
  animation,
  currentTheme,
}: ChangePasswordSuccessModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000); // Auto-close after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.successModal,
            {
              backgroundColor: currentTheme.surface,
              transform: [
                {
                  scale: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
              opacity: animation,
            },
          ]}
        >
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={60} color={COLORS.success} />
          </View>
          <Text style={[styles.successTitle, { color: currentTheme.text }]}>
            {t('settings.passwordChangedSuccessfully')}
          </Text>
          <Text style={[styles.successMessage, { color: currentTheme.textSecondary }]}>
            {t('settings.passwordChangedMessage')}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}
