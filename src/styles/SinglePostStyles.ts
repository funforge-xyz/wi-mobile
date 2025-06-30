import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { getTheme } from '../theme';

const { width } = Dimensions.get('window');

export { getTheme };

export const createSinglePostStyles = (isDarkMode: boolean) => {
  const theme = getTheme(isDarkMode);

  return StyleSheet.create({
    container: {
      flex: 1,
      height: '100%',
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      fontSize: 16,
      fontFamily: FONTS.regular,
      color: theme.text,
    },
    content: {
      flex: 1,
    },
  });
};