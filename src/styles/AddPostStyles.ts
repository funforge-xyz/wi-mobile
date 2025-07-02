
import { StyleSheet } from 'react-native';
import { SPACING, FONTS } from '../config/constants';

export const addPostStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    margin: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 280,
  },
  successIconContainer: {
    marginBottom: SPACING.md,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  successMessage: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
});
