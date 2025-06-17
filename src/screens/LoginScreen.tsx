import { useState } from 'react';
import { View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/auth';
import { storageService } from '../services/storage';
import { validatePassword, getErrorMessage } from '../utils/loginUtils';
import { styles } from '../styles/LoginStyles';
import LoginHeader from '../components/LoginHeader';
import LoginErrorMessage from '../components/LoginErrorMessage';
import LoginInput from '../components/LoginInput';
import LoginImagePicker from '../components/LoginImagePicker';
import LoginTermsCheckbox from '../components/LoginTermsCheckbox';
import LoginButtons from '../components/LoginButtons';

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

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email and password are required');
      return;
    }

    if (isSignUp) {
      if (!firstName.trim() || !lastName.trim()) {
        setErrorMessage('First name and last name are required');
        return;
      }

      // Validate password strength
      const passwordError = validatePassword(password);
      if (passwordError) {
        setErrorMessage(passwordError);
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match');
        return;
      }

      if (!acceptTerms) {
        setErrorMessage('Please accept the terms and conditions');
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
            setErrorMessage('Failed to upload profile picture');
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
          'Account Created!',
          'Please check your email and click the verification link before signing in.',
          [
            {
              text: 'OK',
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
    setErrorMessage('Google Sign In will be available in the production app');
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
        <LoginHeader isSignUp={isSignUp} />

        <View style={styles.form}>
          <LoginErrorMessage errorMessage={errorMessage} />

          {isSignUp && (
            <>
              <LoginInput
                icon="person-outline"
                placeholder="First Name *"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />

              <LoginInput
                icon="person-outline"
                placeholder="Last Name *"
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
                placeholder="Bio (optional)"
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
            placeholder="Email *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <LoginInput
            icon="lock-closed-outline"
            placeholder="Password *"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {isSignUp && (
            <LoginInput
              icon="lock-closed-outline"
              placeholder="Confirm Password *"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          )}

          {isSignUp && (
            <LoginTermsCheckbox
              acceptTerms={acceptTerms}
              setAcceptTerms={setAcceptTerms}
              onTermsPress={() => navigation.navigate('Terms' as never)}
            />
          )}

          <LoginButtons
            isSignUp={isSignUp}
            isLoading={isLoading}
            onEmailAuth={handleEmailAuth}
            onGoogleSignIn={handleGoogleSignIn}
            onSwitchMode={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage('');
              setFirstName('');
              setLastName('');
              setConfirmPassword('');
              setBio('');
              setProfileImage('');
              setAcceptTerms(false);
            }}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

