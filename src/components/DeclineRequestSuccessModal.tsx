
import React, { useEffect } from 'react';
import { View, Text, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/DeclineRequestSuccessModalStyles';

interface DeclineRequestSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  currentTheme: any;
  animation?: Animated.Value;
}

export default function DeclineRequestSuccessModal({
  visible,
  onClose,
  currentTheme,
  animation,
}: DeclineRequestSuccessModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000); // Auto-close after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

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
            styles.successModal,
            {
              backgroundColor: currentTheme.surface,
            },
            animatedStyle,
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons 
              name="checkmark-circle" 
              size={50} 
              color={COLORS.success || '#4CAF50'} 
            />
          </View>

          <Text style={[styles.title, { color: currentTheme.text }]}>
            {t('chats.requestDeclined', 'Request Declined')}
          </Text>

          <Text style={[styles.message, { color: currentTheme.textSecondary }]}>
            {t('chats.requestDeclinedMessage', 'The connection request has been declined successfully.')}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}
