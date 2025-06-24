import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../config/constants';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: Date;
  isFirstMessage?: boolean;
}

interface ChatMessageProps {
  message: Message;
  isMyMessage: boolean;
  currentTheme: any;
}

export default function ChatMessage({
  message,
  isMyMessage,
  currentTheme,
}: ChatMessageProps) {
  return (
    <View style={[
      styles.messageContainer,
      isMyMessage ? styles.myMessage : [styles.otherMessage, { backgroundColor: currentTheme.surface }]
    ]}>
      <Text style={[
        styles.messageText,
        { color: isMyMessage ? 'white' : currentTheme.text }
      ]}>
        {message.text}
      </Text>
      <Text style={[
        styles.messageTime,
        { color: isMyMessage ? 'rgba(255,255,255,0.7)' : currentTheme.textSecondary }
      ]}>
        {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    maxWidth: '80%',
    marginVertical: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  messageTime: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
});