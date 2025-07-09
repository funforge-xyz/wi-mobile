import { useState } from 'react';
import { View, Alert, TouchableOpacity, Text, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/auth';
import { storageService, Settings } from '../services/storage';
import { validatePassword, getErrorMessage } from '../utils/loginUtils';
import { createLoginStyles } from '../styles/LoginStyles';
import LoginHeader from '../components/LoginHeader';
import LoginErrorMessage from '../components/LoginErrorMessage';
import LoginInput from '../components/LoginInput';
import LoginImagePicker from '../components/LoginImagePicker';
import LoginTermsCheckbox from '../components/LoginTermsCheckbox';
import LoginButtons from '../components/LoginButtons';
import LanguageSelectionModal from '../components/LanguageSelectionModal';
import SuccessModal from '../components/SuccessModal';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { getTheme } from '../theme';
import { toggleTheme } from '../store/themeSlice';
import { setLanguage } from '../store/languageSlice';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { t, i18n } = useTranslation();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successAnimation] = useState(new Animated.Value(0));
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const dispatch = useAppDispatch();
  const currentTheme = getTheme(isDarkMode);
  const styles = createLoginStyles(isDarkMode);

  const handleLanguagePress = () => {
    setShowLanguageModal(true);
  };

  const handleLanguageChange = async (code: string) => {
    try {
      await i18n.changeLanguage(code);
      setShowLanguageModal(false);

      // Update Redux state
      dispatch(setLanguage(code));

      // Note: Don't save to storage for login screen since user isn't logged in
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const handleThemeToggle = async () => {
    dispatch(toggleTheme());
    // Persist the new theme setting to storage
    const newTheme = !isDarkMode;
    try {
      const settings = new Settings();
      await settings.setDarkMode(newTheme);
    } catch (error) {
      console.error('Failed to save theme setting:', error);
    }
  };

  const handleSuccessModalClose = () => {
    Animated.timing(successAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccessModal(false);
      // Switch to sign in mode after successful signup
      setIsSignUp(false);
      setErrorMessage('');
      setFirstName('');
      setLastName('');
      setConfirmPassword('');
      setBio('');
      setProfileImage('');
      setAcceptTerms(false);
    });
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('auth.emailPasswordRequired');
      return;
    }

    if (isSignUp) {
      if (!firstName.trim() || !lastName.trim()) {
        setErrorMessage('auth.nameRequired');
        return;
      }

      // Validate password strength
      const passwordError = validatePassword(password);
      if (passwordError) {
        setErrorMessage(passwordError);
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('auth.passwordMismatch');
        return;
      }

      if (!acceptTerms) {
        setErrorMessage('auth.acceptTermsRequired');
        return;
      }
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      if (isSignUp) {
        let photoURL : { fullUrl: string; thumbnailUrl: string; } | string = '';

        // Upload image to Firebase Storage if a local image is selected
        if (profileImage && profileImage.startsWith('file://')) {
          try {
            // Create a temporary user ID for upload (will be replaced with actual user ID after signup)
            const tempUserId = Date.now().toString();
            photoURL = await storageService.uploadProfilePicture(tempUserId, profileImage);
          } catch (uploadError) {
            console.error('Image upload error:', uploadError);
            setErrorMessage('auth.uploadPictureFailed');
            setIsLoading(false);
            return;
          }
        }

        await authService.signUpWithEmail(email, password, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          bio: bio.trim(),
          photoURL: photoURL,
        });

        // Show success modal for signup
        setShowSuccessModal(true);
        Animated.timing(successAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        const user = await authService.signInWithEmail(email, password);

        // Load user's preferred language from Firebase after successful login
        if (user?.uid) {
          const { loadUserLanguagePreference } = await import('../store/userSlice');
          dispatch(loadUserLanguagePreference(user.uid));
        }

        onLoginSuccess?.();
      }
    } catch (error: any) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoading) return;

    if (!authService.isGoogleSignInAvailable()) {
      setErrorMessage('Google Sign-In is not available in Expo Go. Please use email/password or switch to a custom development build.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const user = await authService.signInWithGoogle();
      if (user) {
        console.log('Google sign in successful:', user.uid);
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);

      if (error.code === 'auth/account-exists-with-different-credential') {
        setErrorMessage(t('auth.accountExistsWithDifferentCredential'));
      } else if (error.code === 'auth/invalid-credential') {
        setErrorMessage(t('auth.invalidCredentials'));
      } else if (error.message?.includes('Expo Go')) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(t('auth.googleSignInFailed'));
      }
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
          <LoginErrorMessage 
            errorMessage={errorMessage} 
            onDismiss={() => setErrorMessage('')} 
          />

          {isSignUp && (
            <>
              <LoginInput
                icon="person-outline"
                placeholder={`${t('auth.firstName')} *`}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />

              <LoginInput
                icon="person-outline"
                placeholder={`${t('auth.lastName')} *`}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />

              <LoginImagePicker
                profileImage={profileImage}
                setProfileImage={setProfileImage}
              />

              <LoginInput
                icon="document-text-outline"
                placeholder={t('auth.bioOptional')}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                containerStyle={styles.bioContainer}
                inputStyle={styles.bioInput}
              />
            </>
          )}

          <LoginInput
            icon="mail-outline"
            placeholder={`${t('auth.email')} *`}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <LoginInput
            icon="lock-closed-outline"
            placeholder={`${t('auth.password')} *`}
            value={password}
            onChangeText={setPassword}
            isPassword={true}
          />

          {isSignUp && (
            <LoginInput
              icon="lock-closed-outline"
              placeholder={`${t('auth.confirmPassword')} *`}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword={true}
            />
          )}

          {!isSignUp && (
            <TouchableOpacity 
              onPress={() => navigation.navigate('ForgotPassword' as never)}
              style={styles.forgotPasswordLink}
            >
              <Text style={[styles.forgotPasswordText, { color: currentTheme.primary }]}>
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>
          )}

          {isSignUp && (
            <LoginTermsCheckbox
              acceptTerms={acceptTerms}
              setAcceptTerms={setAcceptTerms}
              onTermsPress={() => navigation.navigate('Terms' as never)}
            />
          )}

          <LoginButtons 
            isLoading={isLoading}
            isSignUp={isSignUp}
            onEmailAuth={handleEmailAuth}
            onGoogleSignIn={handleGoogleSignIn}
            onSwitchMode={() => setIsSignUp(!isSignUp)}
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

      <SuccessModal
        visible={showSuccessModal}
        title={t('auth.accountCreated')}
        message={t('auth.verifyEmail')}
        animation={successAnimation}
        currentTheme={currentTheme}
        onClose={handleSuccessModalClose}
      />
    </SafeAreaView>
  );
}