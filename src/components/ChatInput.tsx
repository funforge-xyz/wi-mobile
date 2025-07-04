
import { View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from 'react-native';
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
    >
      <View style={[styles.container, { 
        backgroundColor: currentTheme.surface,
        borderTopColor: currentTheme.border
      }]}>
        <View style={styles.inputContainer}>
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
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    borderTopWidth: 1,
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
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
