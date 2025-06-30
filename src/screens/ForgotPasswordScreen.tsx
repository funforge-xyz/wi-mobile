
import { useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/auth';
import { createLoginStyles } from '../styles/LoginStyles';
import LoginErrorMessage from '../components/LoginErrorMessage';
import LoginInput from '../components/LoginInput';
import LoginButtons from '../components/LoginButtons';
import ResetPasswordSuccessModal from '../components/ResetPasswordSuccessModal';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { getTheme } from '../theme';
import { toggleTheme } from '../store/themeSlice';
import LoginHeader from '../components/LoginHeader';
import LanguageSelectionModal from '../components/LanguageSelectionModal';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successAnimation] = useState(new Animated.Value(0));
  const { t, i18n } = useTranslation();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const dispatch = useAppDispatch();
  const currentTheme = getTheme(isDarkMode);
  const styles = createLoginStyles(isDarkMode);

  const handleLanguagePress = () => {
    setShowLanguageModal(true);
  };

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setShowLanguageModal(false);
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleSuccessModalClose = () => {
    Animated.timing(successAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccessModal(false);
      navigation.goBack();
    });
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setErrorMessage('auth.emailRequired');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('auth.invalidEmail');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await authService.sendPasswordResetEmail(email.trim());
      
      // Show success modal with animation
      setShowSuccessModal(true);
      Animated.timing(successAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-hide after 3 seconds then navigate back
      setTimeout(() => {
        Animated.timing(successAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowSuccessModal(false);
          navigation.goBack();
        });
      }, 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'auth.resetEmailError');
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
          onLanguagePress={handleLanguagePress}
          onThemeToggle={handleThemeToggle}
          isDarkMode={isDarkMode}
        />

        <View style={styles.form}>
          <Text style={[styles.subtitle, { color: currentTheme.text, marginBottom: 16 }]}>
            {t('auth.forgotPasswordTitle')}
          </Text>
          
          <Text style={[styles.description, { color: currentTheme.textSecondary }]}>
            {t('auth.forgotPasswordDescription')}
          </Text>

          <LoginErrorMessage 
            errorMessage={errorMessage} 
            onDismiss={() => setErrorMessage('')} 
          />

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

      <LanguageSelectionModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        currentTheme={currentTheme}
        onLanguageChange={handleLanguageChange}
        currentLanguage={i18n.language}
      />

      <ResetPasswordSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        animation={successAnimation}
        currentTheme={currentTheme}
      />
    </SafeAreaView>
  );
}
