
import { StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../config/constants';

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  successModal: {
    width: 280,
    padding: SPACING.xl,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  successIconContainer: {
    marginBottom: SPACING.md,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  okButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  okButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
});
