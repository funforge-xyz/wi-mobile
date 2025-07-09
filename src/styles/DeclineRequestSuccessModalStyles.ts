
import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '../config/constants';

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  successModal: {
    borderRadius: 16,
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
    fontSize: 20,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  message: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
});
