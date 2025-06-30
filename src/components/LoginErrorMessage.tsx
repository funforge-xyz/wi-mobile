
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createLoginStyles } from '../styles/LoginStyles';
import { COLORS } from '../config/constants';
import { useAppSelector } from '../hooks/redux';

interface LoginErrorMessageProps {
  errorMessage: string;
}

export default function LoginErrorMessage({ errorMessage }: LoginErrorMessageProps) {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const styles = createLoginStyles(isDarkMode);

  if (!errorMessage) return null;

  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={16} color={COLORS.error} />
      <Text style={styles.errorText}>{errorMessage}</Text>
    </View>
  );
}
