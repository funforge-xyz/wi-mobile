
import { View, Text, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { useTranslation } from 'react-i18next';

interface BlockUserSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  currentTheme: any;
  animation?: Animated.Value;
}

export default function BlockUserSuccessModal({
  visible,
  onClose,
  currentTheme,
  animation,
}: BlockUserSuccessModalProps) {
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

  const styles = {
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: 20,
    },
    successModal: {
      backgroundColor: currentTheme.surface,
      borderRadius: 12,
      padding: 24,
      width: '100%',
      maxWidth: 300,
      alignItems: 'center',
    },
    iconContainer: {
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 12,
    },
    message: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    button: {
      backgroundColor: COLORS.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 8,
      minWidth: 100,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
  };

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
            {t('userProfile.userBlockedSuccess')}
          </Text>

          <Text style={[styles.message, { color: currentTheme.textSecondary }]}>
            {t('userProfile.userBlockedMessage')}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>
              {t('common.ok')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
