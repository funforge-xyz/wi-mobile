
import { StyleSheet } from 'react-native';
import { FONTS, SPACING } from '../config/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
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
