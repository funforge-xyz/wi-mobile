
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useTranslation } from 'react-i18next';

interface CommentInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  currentTheme: any;
  replyToComment?: {
    id: string;
    authorName: string;
  } | null;
  onCancelReply?: () => void;
}

export default function CommentInput({
  value,
  onChangeText,
  onSubmit,
  isSubmitting,
  currentTheme,
  replyToComment,
  onCancelReply,
}: CommentInputProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.commentInputContainer, { 
      backgroundColor: currentTheme.surface,
      borderTopColor: currentTheme.border
    }]}>
      {replyToComment && (
        <View style={[styles.replyBanner, { backgroundColor: currentTheme.background }]}>
          <Text style={[styles.replyText, { color: currentTheme.textSecondary }]}>
            {t('singlePost.replyingTo')} <Text style={{ color: currentTheme.text, fontFamily: FONTS.medium }}>
              {replyToComment.authorName}
            </Text>
          </Text>
          <TouchableOpacity onPress={onCancelReply} style={styles.cancelReplyButton}>
            <Ionicons name="close" size={16} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.commentInput, { 
            backgroundColor: currentTheme.background,
            color: currentTheme.text,
            borderColor: currentTheme.border
          }]}
          placeholder={replyToComment ? t('singlePost.writeReply') : t('singlePost.writeComment')}
          placeholderTextColor={currentTheme.textSecondary}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, { 
            backgroundColor: value.trim() ? COLORS.primary : currentTheme.border 
          }]}
          onPress={onSubmit}
          disabled={!value.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  commentInputContainer: {
    borderTopWidth: 1,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  replyText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  cancelReplyButton: {
    padding: SPACING.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    maxHeight: 100,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
