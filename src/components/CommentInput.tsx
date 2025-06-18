
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
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
}

export default function CommentInput({
  value,
  onChangeText,
  onSubmit,
  isSubmitting,
  currentTheme,
}: CommentInputProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.commentInputContainer, { 
      backgroundColor: currentTheme.surface,
      borderTopColor: currentTheme.border
    }]}>
      <TextInput
        style={[styles.commentInput, { 
          backgroundColor: currentTheme.background,
          color: currentTheme.text,
          borderColor: currentTheme.border
        }]}
        placeholder={t('singlePost.writeComment')}
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
  );
}

const styles = StyleSheet.create({
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    borderTopWidth: 1,
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
