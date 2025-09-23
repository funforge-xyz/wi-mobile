import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface EmailVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  currentTheme: any;
  animation?: Animated.Value;
}

export default function EmailVerificationModal({
  visible,
  onClose,
  currentTheme,
  animation,
}: EmailVerificationModalProps) {
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
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.verificationModal,
            {
              backgroundColor: currentTheme.surface,
            },
            animatedStyle,
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons 
              name="mail" 
              size={50} 
              color={COLORS.primary} 
            />
          </View>

          <Text style={[styles.title, { color: currentTheme.text }]}>
            {t('auth.emailVerificationRequired')}
          </Text>

          <Text style={[styles.message, { color: currentTheme.textSecondary }]}>
            {t('auth.emailVerificationMessage')}
          </Text>

          <Text style={[styles.instruction, { color: currentTheme.textSecondary }]}>
            {t('auth.emailVerificationInstruction')}
          </Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: COLORS.primary }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>
              {t('auth.gotIt')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = {
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  verificationModal: {
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  instruction: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
};