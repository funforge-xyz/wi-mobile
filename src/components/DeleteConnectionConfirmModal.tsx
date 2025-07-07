
import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { FONTS, SPACING } from '../config/constants';

interface DeleteConnectionConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  userName: string;
  currentTheme: any;
}

export default function DeleteConnectionConfirmModal({
  visible,
  onConfirm,
  onCancel,
  userName,
  currentTheme,
}: DeleteConnectionConfirmModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: currentTheme.surface }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#ff4757' }]}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </View>
          
          <Text style={[styles.title, { color: currentTheme.text }]}>
            {t('connections.deleteConnectionTitle')}
          </Text>
          
          <Text style={[styles.message, { color: currentTheme.textSecondary }]}>
            {t('connections.deleteConnectionMessage', { userName })}
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: currentTheme.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelButtonText, { color: currentTheme.text }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>
                {t('connections.delete')}
              </Text>
            </TouchableOpacity>
          </View>
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
    maxWidth: 320,
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
    marginBottom: SPACING.xl,
  },
  buttonContainer: {
    flexDirection: 'row' as const,
    gap: SPACING.md,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: '#ff4757',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#fff',
  },
};
