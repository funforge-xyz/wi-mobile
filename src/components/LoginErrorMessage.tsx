
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createLoginStyles } from '../styles/LoginStyles';
import { COLORS } from '../config/constants';
import { useAppSelector } from '../hooks/redux';

interface LoginErrorMessageProps {
  errorMessage: string;
  onDismiss?: () => void;
}

export default function LoginErrorMessage({ errorMessage, onDismiss }: LoginErrorMessageProps) {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const styles = createLoginStyles(isDarkMode);

  if (!errorMessage) return null;

  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorContent}>
        <Ionicons name="alert-circle" size={16} color={COLORS.error} />
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.errorDismissButton}>
          <Ionicons name="close" size={16} color={COLORS.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}
