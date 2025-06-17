
import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/LoginStyles';

interface LoginHeaderProps {
  isSignUp: boolean;
}

export default function LoginHeader({ isSignUp }: LoginHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>
        {isSignUp ? 'Create Account' : 'Welcome Back'}
      </Text>
      <Text style={styles.subtitle}>
        {isSignUp ? 'Sign up to get started' : 'Sign in to continue'}
      </Text>
    </View>
  );
}
