
import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '../config/constants';

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  confirmationModal: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  message: {
    fontSize: FONTS.sizes.md,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: SPACING.md,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: COLORS.error,
  },
  cancelButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
  },
  confirmButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
    color: COLORS.white,
  },
});
