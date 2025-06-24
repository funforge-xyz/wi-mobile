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
  confirmationModal: {
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },
});