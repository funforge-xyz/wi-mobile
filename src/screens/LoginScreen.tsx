import { useState } from 'react';
import { View, Alert, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/auth';
import { storageService } from '../services/storage';
import { validatePassword, getErrorMessage } from '../utils/loginUtils';
import { createLoginStyles } from '../styles/LoginStyles';
import LoginHeader from '../components/LoginHeader';
import LoginErrorMessage from '../components/LoginErrorMessage';
import LoginInput from '../components/LoginInput';
import LoginImagePicker from '../components/LoginImagePicker';
import LoginTermsCheckbox from '../components/LoginTermsCheckbox';
import LoginButtons from '../components/LoginButtons';
import LanguageSelectionModal from '../components/LanguageSelectionModal';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { getTheme } from '../theme';
import { toggleTheme } from '../store/themeSlice';

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

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage(t('auth.emailPasswordRequired'));
      return;
    }

    if (isSignUp) {
      if (!firstName.trim() || !lastName.trim()) {
        setErrorMessage(t('auth.nameRequired'));
        return;
      }

      // Validate password strength
      const passwordError = validatePassword(password);
      if (passwordError) {
        setErrorMessage(passwordError);
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage(t('auth.passwordMismatch'));
        return;
      }

      if (!acceptTerms) {
        setErrorMessage(t('auth.acceptTermsRequired'));
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
            setErrorMessage(t('auth.uploadPictureFailed'));
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

        // Show success message for signup
        Alert.alert(
          t('auth.accountCreated'),
          t('auth.verifyEmail'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                // Switch to sign in mode after successful signup
                setIsSignUp(false);
                setErrorMessage('');
                setFirstName('');
                setLastName('');
                setConfirmPassword('');
                setBio('');
                setProfileImage('');
                setAcceptTerms(false);
              }
            }
          ]
        );
      } else {
        await authService.signInWithEmail(email, password);
        onLoginSuccess?.();
      }
    } catch (error: any) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // TODO: Google Sign In not working with Expo Go - temporarily disabled
    setErrorMessage(t('auth.googleSignInUnavailable'));
    return;

    // setIsLoading(true);
    // setErrorMessage('');
    // try {
    //   await authService.signInWithGoogle();
    //   onLoginSuccess?.();
    // } catch (error: any) {
    //   setErrorMessage(getErrorMessage(error));
    // } finally {
    //   setIsLoading(false);
    // }
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
    </SafeAreaView>
  );
}