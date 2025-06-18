
import { StyleSheet } from 'react-native';
import { FONTS, SPACING } from '../config/constants';

export const singlePostStyles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  content: {
    flex: 1,
  },
});
