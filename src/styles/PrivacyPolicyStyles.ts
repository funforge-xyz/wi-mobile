
import { StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../config/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  lastUpdated: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
    fontStyle: 'italic',
  },
});

export const lightTheme = {
  background: COLORS.background,
  surface: COLORS.surface,
  text: COLORS.text,
  textSecondary: COLORS.textSecondary,
  border: COLORS.border,
};

export const darkTheme = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
};
