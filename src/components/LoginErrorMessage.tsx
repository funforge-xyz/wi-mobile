import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/LoginStyles';
import { COLORS } from '../config/constants';

interface LoginErrorMessageProps {
  errorMessage: string;
}

export default function LoginErrorMessage({ errorMessage }: LoginErrorMessageProps) {
  if (!errorMessage) return null;

  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={16} color={COLORS.error} />
      <Text style={styles.errorText}>{errorMessage}</Text>
    </View>
  );
}