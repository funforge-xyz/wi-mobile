
import { View, Text, Modal, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { addPostStyles } from '../styles/AddPostStyles';

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  animation: Animated.Value;
  currentTheme: any;
  isLoading?: boolean;
}

export default function SuccessModal({
  visible,
  title,
  message,
  animation,
  currentTheme,
  isLoading = false,
}: SuccessModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      <View style={addPostStyles.modalOverlay}>
        <Animated.View
          style={[
            addPostStyles.successModal,
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
          <View style={addPostStyles.successIconContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
              <Ionicons name="checkmark-circle" size={60} color={COLORS.success} />
            )}
          </View>
          <Text style={[addPostStyles.successTitle, { color: currentTheme.text }]}>
            {title}
          </Text>
          {message && (
            <Text style={[addPostStyles.successMessage, { color: currentTheme.textSecondary }]}>
              {message}
            </Text>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
