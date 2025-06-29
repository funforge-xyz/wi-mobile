import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
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
  replyToComment?: { id: string; authorName: string } | null;
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
    <View style={[styles.container, { backgroundColor: currentTheme.surface, borderTopColor: currentTheme.border }]}>
      {replyToComment && (
        <View style={[styles.replyIndicator, { backgroundColor: currentTheme.background, borderColor: '#3498db' }]}>
          <Ionicons name="arrow-undo" size={16} color="#3498db" />
          <Text style={[styles.replyText, { color: '#3498db' }]}>
            {t('singlePost.replyingTo')} {replyToComment.authorName}
          </Text>
          {onCancelReply && (
            <TouchableOpacity onPress={onCancelReply} style={styles.cancelReplyButton}>
              <Ionicons name="close" size={16} color="#3498db" />
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: currentTheme.background,
              color: currentTheme.text,
              borderColor: currentTheme.border,
            },
          ]}
          placeholder={replyToComment ? t('singlePost.writeReply') : t('singlePost.addComment')}
          placeholderTextColor={currentTheme.textSecondary}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={500}
          editable={!isSubmitting}
        />
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: value.trim() && !isSubmitting ? COLORS.primary : currentTheme.textSecondary,
            },
          ]}
          onPress={onSubmit}
          disabled={!value.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={18} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  replyText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  cancelReplyButton: {
    padding: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    maxHeight: 100,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});