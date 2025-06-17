
import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/LoginStyles';

interface LoginErrorMessageProps {
  errorMessage: string;
}

export default function LoginErrorMessage({ errorMessage }: LoginErrorMessageProps) {
  if (!errorMessage) return null;

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{errorMessage}</Text>
    </View>
  );
}
