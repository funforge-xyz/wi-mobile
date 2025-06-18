
import { TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';

interface ChatInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: () => void;
  sending: boolean;
  currentTheme: any;
  t: (key: string) => string;
}

export default function ChatInput({
  newMessage,
  setNewMessage,
  onSendMessage,
  sending,
  currentTheme,
  t,
}: ChatInputProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.inputContainer, { 
        backgroundColor: currentTheme.surface,
        borderTopColor: currentTheme.border
      }]}
    >
      <TextInput
        style={[styles.textInput, { 
          backgroundColor: currentTheme.background,
          color: currentTheme.text,
          borderColor: currentTheme.border
        }]}
        value={newMessage}
        onChangeText={setNewMessage}
        placeholder={t('chat.messageInput')}
        placeholderTextColor={currentTheme.textSecondary}
        multiline
        maxLength={500}
      />
      <TouchableOpacity
        style={[styles.sendButton, { 
          backgroundColor: newMessage.trim() ? COLORS.primary : currentTheme.border 
        }]}
        onPress={onSendMessage}
        disabled={!newMessage.trim() || sending}
      >
        {sending ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Ionicons name="send" size={20} color="white" />
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = {
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: SPACING.sm,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
};
