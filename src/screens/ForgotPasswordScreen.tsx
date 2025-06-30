
import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/auth';
import { createLoginStyles } from '../styles/LoginStyles';
import LoginHeader from '../components/LoginHeader';
import LoginErrorMessage from '../components/LoginErrorMessage';
import LoginInput from '../components/LoginInput';
import LoginButtons from '../components/LoginButtons';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { getTheme } from '../theme';
import { toggleTheme } from '../store/themeSlice';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { t } = useTranslation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const dispatch = useAppDispatch();
  const currentTheme = getTheme(isDarkMode);
  const styles = createLoginStyles(isDarkMode);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setErrorMessage(t('auth.emailRequired'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage(t('auth.invalidEmail'));
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await authService.sendPasswordResetEmail(email.trim());
      
      Alert.alert(
        t('auth.resetEmailSent'),
        t('auth.resetEmailSentMessage'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack(),
          }
        ]
      );
    } catch (error: any) {
      setErrorMessage(error.message || t('auth.resetEmailError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
      >
        <LoginHeader 
          currentTheme={currentTheme} 
          styles={styles} 
          onThemeToggle={handleThemeToggle}
          isDarkMode={isDarkMode}
        />

        <View style={styles.form}>
          <Text style={[styles.subtitle, { color: currentTheme.text }]}>
            {t('auth.forgotPasswordTitle')}
          </Text>
          
          <Text style={[styles.description, { color: currentTheme.textSecondary }]}>
            {t('auth.forgotPasswordDescription')}
          </Text>

          <LoginErrorMessage errorMessage={errorMessage} />

          <LoginInput
            icon="mail-outline"
            placeholder={`${t('auth.email')} *`}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <LoginButtons 
            isLoading={isLoading}
            isSignUp={false}
            onEmailAuth={handlePasswordReset}
            onGoogleSignIn={() => {}}
            onSwitchMode={() => navigation.goBack()}
            primaryButtonText={t('auth.sendResetEmail')}
            switchModeText={t('auth.backToSignIn')}
            hideGoogleButton={true}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
