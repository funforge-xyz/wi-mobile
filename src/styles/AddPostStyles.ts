import { StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { getTheme } from '../theme';

export const addPostStyles = StyleSheet.create({
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
  postButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  postButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: 'white',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  textInput: {
    fontSize: 18,
    fontFamily: FONTS.regular,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: SPACING.sm,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginBottom: SPACING.lg,
  },
  characterCountText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  imageSection: {
    marginBottom: SPACING.lg,
  },
  imagePickerContainer: {
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  imagePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagePickerText: {
    marginLeft: SPACING.sm,
    fontSize: 16,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    opacity: 0.9,
  },
  videoIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyContainer: {
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyTextContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  privacyText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  privacySubtext: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  optionsContainer: {
    borderRadius: 12,
    padding: SPACING.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  optionText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  optionSubtext: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginVertical: SPACING.sm,
  },
  switchContainer: {
    width: 40,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
});