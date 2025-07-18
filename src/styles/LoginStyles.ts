import { StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { getTheme } from '../theme';

export const createLoginStyles = (isDarkMode: boolean) => {
  const theme = getTheme(isDarkMode);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      marginBottom: SPACING.xl,
    },
    title: {
      fontSize: 28,
      fontFamily: FONTS.bold,
      color: theme.text,
      flex: 1,
    },
    subtitle: {
      fontSize: 24,
      fontFamily: FONTS.bold,
      color: theme.text,
      textAlign: 'center',
    },
    description: {
      fontSize: 16,
      fontFamily: FONTS.regular,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: SPACING.lg,
      lineHeight: 22,
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    themeButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: SPACING.xs,
    },
    languageButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    form: {
      flex: 1,
      paddingHorizontal: SPACING.lg,
    },
    inputContainer: {
      marginBottom: SPACING.md,
    },
    input: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 12,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      fontFamily: FONTS.regular,
      color: theme.text,
    },
    icon: {
      color: theme.textSecondary,
      marginRight: SPACING.sm,
    },
    passwordToggle: {
      padding: 4,
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
      backgroundColor: theme.border,
    },
    dividerText: {
      marginHorizontal: SPACING.md,
      fontSize: 14,
      color: theme.textSecondary,
    },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
      paddingVertical: SPACING.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.lg,
    },
    socialButtonText: {
      marginLeft: SPACING.sm,
      fontSize: 16,
      fontFamily: FONTS.medium,
      color: theme.text,
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#4A1A1A' : '#FFF5F5',
      borderWidth: 1,
      borderColor: COLORS.error,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    errorContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    errorText: {
      flex: 1,
      marginLeft: 8,
      fontSize: 14,
      color: COLORS.error,
      fontWeight: '500',
    },
    errorDismissButton: {
      padding: 4,
      marginLeft: 8,
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
      borderColor: theme.border,
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
      color: theme.text,
    },
    termsLink: {
      color: COLORS.primary,
      textDecorationLine: 'underline',
    },
    imagePickerContainer: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      borderWidth: 1,
      borderColor: theme.border,
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
      color: theme.text,
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
    removeImageText: { //Corrected typo here
      fontSize: 12,
      textDecorationLine: 'underline',
    },
    bioContainer: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      borderRadius: 12,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      marginBottom: SPACING.md,
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 80,
    },
    bioIconContainer: {
      paddingTop: 12,
    },
    bioInput: {
      flex: 1,
      marginLeft: SPACING.sm,
      fontSize: 16,
      fontFamily: FONTS.regular,
      minHeight: 60,
      color: theme.text,
    },
    forgotPasswordLink: {
      alignSelf: 'flex-end',
      marginBottom: SPACING.md,
      marginTop: SPACING.xs,
    },
    forgotPasswordText: {
      fontSize: 14,
      color: COLORS.primary,
      fontFamily: FONTS.medium,
    },
    imagePickerContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    imagePickerButton: {
      flex: 1,
      justifyContent: 'center',
      minHeight: 44,
    },
    imagePickerText: {
      fontSize: 16,
    },
    imagePreviewContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    profilePreview: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 12,
    },
    removeImageIcon: {
      padding: 4,
    },
    bioContainer: {
      marginBottom: 15,
    },
    bioInput: {
      height: 80,
      textAlignVertical: 'top',
      paddingTop: 12,
    },
    inputContainer: {
      marginBottom: 15,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F9FA',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#404040' : '#E1E5E9',
      paddingHorizontal: 15,
      minHeight: 50,
    },
    inputIcon: {
      marginRight: 12,
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 12,
    },
    passwordToggle: {
      padding: 5,
      marginLeft: 10,
    },
  });
};

// Keep the old export for backward compatibility
export const styles = createLoginStyles(false);