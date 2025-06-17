
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { styles } from '../styles/LoginStyles';

interface LoginButtonsProps {
  isSignUp: boolean;
  isLoading: boolean;
  onEmailAuth: () => void;
  onGoogleSignIn: () => void;
  onSwitchMode: () => void;
}

export default function LoginButtons({
  isSignUp,
  isLoading,
  onEmailAuth,
  onGoogleSignIn,
  onSwitchMode,
}: LoginButtonsProps) {
  return (
    <>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onEmailAuth}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.primaryButtonText}>
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={styles.socialButton}
        onPress={onGoogleSignIn}
        disabled={isLoading}
      >
        <Ionicons name="logo-google" size={20} color={COLORS.text} />
        <Text style={styles.socialButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={onSwitchMode}
      >
        <Text style={styles.switchButtonText}>
          {isSignUp ? 'Already have an account? Sign In' : 'Don\'t have an account? Sign Up'}
        </Text>
      </TouchableOpacity>
    </>
  );
}
