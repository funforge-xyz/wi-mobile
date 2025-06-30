
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
      alignItems: 'center',
      marginBottom: SPACING.xl,
      paddingHorizontal: SPACING.lg,
      position: 'relative',
    },
    title: {
      fontSize: 28,
      fontFamily: FONTS.bold,
      textAlign: 'center',
      marginBottom: SPACING.sm,
      color: theme.text,
    },
    headerButtons: {
      position: 'absolute',
      top: 0,
      right: 0,
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
      backgroundColor: isDarkMode ? '#3D2A2A' : '#FFF5F5',
      borderColor: isDarkMode ? '#E53E3E' : '#FEB2B2',
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
      paddingTop: 2,
    },
    bioInput: {
      flex: 1,
      marginLeft: SPACING.sm,
      fontSize: 16,
      fontFamily: FONTS.regular,
      minHeight: 60,
      color: theme.text,
    },
    textInput: {
      flex: 1,
      marginLeft: SPACING.md,
      fontSize: 16,
      fontFamily: FONTS.regular,
      color: theme.text,
    },
    icon: {
      color: theme.textSecondary,
    },
  });
};

// Keep the old export for backward compatibility
export const styles = createLoginStyles(false);
