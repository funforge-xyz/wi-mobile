
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../config/constants';
import { createLoginStyles } from '../styles/LoginStyles';
import { useAppSelector } from '../hooks/redux';

interface LoginButtonsProps {
  isLoading: boolean;
  isSignUp: boolean;
  onEmailAuth: () => void;
  onGoogleSignIn: () => void;
  onSwitchMode: () => void;
}

export default function LoginButtons({
  isLoading,
  isSignUp,
  onEmailAuth,
  onGoogleSignIn,
  onSwitchMode,
}: LoginButtonsProps) {
  const { t } = useTranslation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const styles = createLoginStyles(isDarkMode);

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
            {isSignUp ? t('auth.signUp') : t('auth.signIn')}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('auth.or')}</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={styles.socialButton}
        onPress={onGoogleSignIn}
        disabled={isLoading}
      >
        <Ionicons name="logo-google" size={20} color={COLORS.primary} />
        <Text style={styles.socialButtonText}>
          {isSignUp ? t('auth.signUpWithGoogle') : t('auth.signInWithGoogle')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.switchButton} onPress={onSwitchMode}>
        <Text style={styles.switchButtonText}>
          {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
        </Text>
      </TouchableOpacity>
    </>
  );
}
