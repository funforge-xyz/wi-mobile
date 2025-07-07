
import React, { useEffect } from 'react';
import { View, Text, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { FONTS, SPACING } from '../config/constants';

interface DeleteConnectionSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  currentTheme: any;
}

export default function DeleteConnectionSuccessModal({
  visible,
  onClose,
  currentTheme,
}: DeleteConnectionSuccessModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: currentTheme.surface }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#2ed573' }]}>
            <Ionicons name="checkmark-outline" size={24} color="#fff" />
          </View>
          
          <Text style={[styles.title, { color: currentTheme.text }]}>
            {t('connections.connectionDeleted')}
          </Text>
          
          <Text style={[styles.message, { color: currentTheme.textSecondary }]}>
            {t('connections.connectionDeletedMessage')}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: SPACING.lg,
  },
  modal: {
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center' as const,
    maxWidth: 300,
    width: '100%',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    textAlign: 'center' as const,
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
};
