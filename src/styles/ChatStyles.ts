
import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '../config/constants';

export const createChatStyles = (isDarkMode: boolean) => {
  const theme = {
    background: isDarkMode ? COLORS.darkBackground : COLORS.background,
    surface: isDarkMode ? COLORS.darkSurface : COLORS.surface,
    text: isDarkMode ? COLORS.darkText : COLORS.text,
    textSecondary: isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary,
    border: isDarkMode ? COLORS.darkBorder : COLORS.border,
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    messagesList: {
      flex: 1,
      paddingHorizontal: SPACING.md,
    },
    messagesContainer: {
      paddingVertical: SPACING.sm,
    },
    messageItem: {
      marginVertical: SPACING.xs,
    },
    ownMessage: {
      alignSelf: 'flex-end',
      backgroundColor: COLORS.primary,
      borderRadius: 18,
      borderBottomRightRadius: 4,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      maxWidth: '80%',
    },
    otherMessage: {
      alignSelf: 'flex-start',
      backgroundColor: theme.surface,
      borderRadius: 18,
      borderBottomLeftRadius: 4,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      maxWidth: '80%',
    },
    ownMessageText: {
      color: '#ffffff',
      fontSize: 16,
      fontFamily: FONTS.regular,
    },
    otherMessageText: {
      color: theme.text,
      fontSize: 16,
      fontFamily: FONTS.regular,
    },
    messageTime: {
      fontSize: 12,
      fontFamily: FONTS.regular,
      color: theme.textSecondary,
      alignSelf: 'flex-end',
      marginTop: SPACING.xs,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    textInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: theme.background,
      color: theme.text,
      fontSize: 16,
      fontFamily: FONTS.regular,
      maxHeight: 100,
    },
    sendButton: {
      marginLeft: SPACING.sm,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: COLORS.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: theme.textSecondary,
    },
  });
};
