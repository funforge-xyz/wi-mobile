
import { View, Text, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/DeletePostConfirmationModalStyles';

interface DeletePostConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  currentTheme: any;
  animation?: Animated.Value;
}

export default function DeletePostConfirmationModal({
  visible,
  onConfirm,
  onCancel,
  currentTheme,
  animation,
}: DeletePostConfirmationModalProps) {
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
              name="trash" 
              size={50} 
              color={COLORS.error} 
            />
          </View>

          <Text style={[styles.title, { color: currentTheme.text }]}>
            {t('singlePost.deletePost')}
          </Text>

          <Text style={[styles.message, { color: currentTheme.textSecondary }]}>
            {t('singlePost.deletePostConfirmation')}
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
                {t('common.delete')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
