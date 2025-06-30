
import { View, Text, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/ResetPasswordSuccessModalStyles';

interface ResetPasswordSuccessModalProps {
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

export default function ResetPasswordSuccessModal({
  visible,
  onClose,
  animation,
  currentTheme,
}: ResetPasswordSuccessModalProps) {
  const { t } = useTranslation();

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
            {t('auth.resetEmailSent')}
          </Text>
          <Text style={[styles.successMessage, { color: currentTheme.textSecondary }]}>
            {t('auth.resetEmailSentMessage')}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}
