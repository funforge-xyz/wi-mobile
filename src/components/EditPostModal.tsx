import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useTranslation } from 'react-i18next';

interface EditPostModalProps {
  visible: boolean;
  content: string;
  isPrivate: boolean;
  allowComments: boolean;
  showLikeCount: boolean;
  onContentChange: (text: string) => void;
  onPrivacyChange: (value: boolean) => void;
  onAllowCommentsChange: (value: boolean) => void;
  onShowLikeCountChange: (value: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  currentTheme: any;
}

export default function EditPostModal({
  visible,
  content,
  isPrivate,
  allowComments,
  showLikeCount,
  onContentChange,
  onPrivacyChange,
  onAllowCommentsChange,
  onShowLikeCountChange,
  onSave,
  onCancel,
  onDelete,
  currentTheme,
}: EditPostModalProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
            {t('singlePost.editPost')}
          </Text>
          <TouchableOpacity onPress={onSave}>
            <Text style={styles.modalSave}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAwareScrollView style={styles.modalContent}>
          <View style={styles.modalSection}>
            <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
              {t('singlePost.content')}
            </Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: currentTheme.surface, 
                color: currentTheme.text,
                borderColor: currentTheme.border 
              }]}
              value={content}
              onChangeText={onContentChange}
              placeholder="What's on your mind?"
              placeholderTextColor={currentTheme.textSecondary}
              multiline
              numberOfLines={6}
            />
          </View>

          <View style={styles.modalSection}>
            <View style={styles.switchContainer}>
              <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
                {t('singlePost.privacy')}
              </Text>
              <Switch
                value={isPrivate}
                onValueChange={onPrivacyChange}
                trackColor={{ false: currentTheme.border, true: COLORS.primary }}
                thumbColor={isPrivate ? '#fff' : currentTheme.textSecondary}
              />
            </View>
            <Text style={[styles.switchDescription, { color: currentTheme.textSecondary }]}>
              {t('singlePost.privatePostDescription')}
            </Text>
          </View>

          <View style={styles.modalSection}>
            <View style={styles.switchContainer}>
              <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
                {t('singlePost.allowComments')}
              </Text>
              <Switch
                value={allowComments}
                onValueChange={onAllowCommentsChange}
                trackColor={{ false: currentTheme.border, true: COLORS.primary }}
                thumbColor={allowComments ? '#fff' : currentTheme.textSecondary}
              />
            </View>
          </View>

          <View style={styles.modalSection}>
            <View style={styles.switchContainer}>
              <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
                {t('singlePost.showLikeCount')}
              </Text>
              <Switch
                value={showLikeCount}
                onValueChange={onShowLikeCountChange}
                trackColor={{ false: currentTheme.border, true: COLORS.primary }}
                thumbColor={showLikeCount ? '#fff' : currentTheme.textSecondary}
              />
            </View>
          </View>

          <View style={styles.modalSection}>
            <TouchableOpacity 
              style={[styles.deleteButton, { borderColor: COLORS.error }]}
              onPress={onDelete}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              <Text style={[styles.deleteButtonText, { color: COLORS.error }]}>
                {t('singlePost.deletePost')}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  modalSave: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  modalSection: {
    marginVertical: SPACING.md,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
  },
  textArea: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  switchDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.sm,
  },
});