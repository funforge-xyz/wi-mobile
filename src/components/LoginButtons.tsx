
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
  primaryButtonText?: string;
  switchModeText?: string;
  hideGoogleButton?: boolean;
}

export default function LoginButtons({
  isLoading,
  isSignUp,
  onEmailAuth,
  onGoogleSignIn,
  onSwitchMode,
  primaryButtonText,
  switchModeText,
  hideGoogleButton = false,
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
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>
            {primaryButtonText || (isSignUp ? t('auth.signUp') : t('auth.signIn'))}
          </Text>
        )}
      </TouchableOpacity>

      {!hideGoogleButton && (
        <>
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
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <Text style={styles.socialButtonText}>
              {t('auth.signInWithGoogle')}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity 
        style={styles.switchButton}
        onPress={onSwitchMode} 
        disabled={isLoading}
      >
        <Text style={styles.switchButtonText}>
          {switchModeText || (isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount'))}
        </Text>
      </TouchableOpacity>
    </>
  );
}
