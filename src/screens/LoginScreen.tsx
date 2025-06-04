import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { authService } from '../services/auth';
import { storageService } from '../services/storage';
import { COLORS, FONTS, SPACING } from '../config/constants';

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

  const getErrorMessage = (error: any): string => {
    const errorCode = error.code;
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add a photo',
      [
        {
          text: 'Camera',
          onPress: handleCameraCapture,
        },
        {
          text: 'Photo Library',
          onPress: handleImagePicker,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      // Check file size (2.5MB = 2,621,440 bytes)
      if (asset.fileSize && asset.fileSize > 2621440) {
        Alert.alert('File Too Large', 'Please select an image smaller than 2.5MB');
        return;
      }

      setProfileImage(asset.uri);
    }
  };

  const handleCameraCapture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access the camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 2621440) {
        Alert.alert('File Too Large', 'Please select an image smaller than 2.5MB');
        return;
      }

      setProfileImage(asset.uri);
    }
  };

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
        let photoURL = '';

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
      } else {
        await authService.signInWithEmail(email, password);
      }
      onLoginSuccess?.();
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
        <View style={styles.header}>
          <Text style={styles.title}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Sign up to get started' : 'Sign in to continue'}
          </Text>
        </View>

        <View style={styles.form}>
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {isSignUp && (
          <>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={[styles.input, { color: COLORS.text }]}
                placeholder="First Name *"
                placeholderTextColor={COLORS.textSecondary}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={[styles.input, { color: COLORS.text }]}
                placeholder="Last Name *"
                placeholderTextColor={COLORS.textSecondary}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity style={styles.imagePickerContainer} onPress={showImagePickerOptions}>
              <View style={styles.imagePickerContent}>
                <Ionicons name="camera-outline" size={20} color={COLORS.textSecondary} />
                <Text style={[styles.imagePickerText, { color: COLORS.textSecondary }]}>
                  {profileImage ? 'Change Profile Picture' : 'Add Profile Picture (optional)'}
                </Text>
              </View>
              {profileImage && (
                <View style={styles.selectedImageContainer}>
                  <Image source={{ uri: profileImage }} style={styles.selectedImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton} 
                    onPress={() => setProfileImage('')}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.bioContainer}>
              <View style={styles.bioIconContainer}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.textSecondary} />
              </View>
              <TextInput
                style={[styles.bioInput, { color: COLORS.text }]}
                placeholder="Bio (optional)"
                placeholderTextColor={COLORS.textSecondary}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </>
        )}

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={[styles.input, { color: COLORS.text }]}
            placeholder="Email *"
            placeholderTextColor={COLORS.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={[styles.input, { color: COLORS.text }]}
            placeholder="Password *"
            placeholderTextColor={COLORS.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {isSignUp && (
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={[styles.input, { color: COLORS.text }]}
              placeholder="Confirm Password *"
              placeholderTextColor={COLORS.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
        )}

        {isSignUp && (
          <TouchableOpacity 
            style={styles.termsContainer} 
            onPress={() => setAcceptTerms(!acceptTerms)}
          >
            <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
              {acceptTerms && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
            <Text style={styles.termsText}>
              I accept the{' '}
              <Text 
                style={styles.termsLink}
                onPress={() => {
                  navigation.navigate('Terms' as never);
                }}
              >
                Terms and Conditions
              </Text>
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleEmailAuth}
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
          onPress={handleGoogleSignIn}
          disabled={isLoading}
        >
          <Ionicons name="logo-google" size={20} color={COLORS.text} />
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => {
            setIsSignUp(!isSignUp);
            setErrorMessage('');
            setFirstName('');
            setLastName('');
            setConfirmPassword('');
            setBio('');
            setProfileImage('');
            setAcceptTerms(false);
          }}
        >
          <Text style={styles.switchButtonText}>
            {isSignUp ? 'Already have an account? Sign In' : 'Don\'t have an account? Sign Up'}
          </Text>
        </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  form: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  socialButtonText: {
    marginLeft: SPACING.sm,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  switchButton: {
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FEB2B2',
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  termsLink: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  imagePickerContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imagePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagePickerText: {
    marginLeft: SPACING.sm,
    fontSize: 16,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  selectedImageContainer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    position: 'relative',
  },
  selectedImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: '35%',
    backgroundColor: 'white',
    borderRadius: 12,
  },
  bioContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
  },
  bioIconContainer: {
    paddingTop: 2,
  },
  bioInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 16,
    fontFamily: FONTS.regular,
    minHeight: 60,
  },
});