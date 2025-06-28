import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: Date;
  deliveredAt?: Date;
  seenAt?: Date;
  isFirstMessage?: boolean;
}

interface ChatMessageProps {
  message: Message;
  isMyMessage: boolean;
  currentTheme: any;
}

const getMessageStatusIcon = (message: Message) => {
  if (!message.deliveredAt) {
    // Not delivered yet - sending
    return (
      <Ionicons 
        name="radio-button-off-outline" 
        size={12} 
        color="rgba(255,255,255,0.6)" 
        style={styles.statusIcon}
      />
    );
  } else if (message.seenAt) {
    // Seen - double blue checkmarks
    return (
      <Ionicons 
        name="checkmark-done" 
        size={16} 
        color={COLORS.primary} 
        style={styles.statusIcon}
      />
    );
  } else {
    // Delivered but not seen - single gray checkmark
    return (
      <Ionicons 
        name="checkmark" 
        size={16} 
        color="rgba(255,255,255,0.6)" 
        style={styles.statusIcon}
      />
    );
  }
};

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
      <View style={styles.messageFooter}>
        <Text style={[
          styles.messageTime,
          { color: isMyMessage ? 'rgba(255,255,255,0.7)' : currentTheme.textSecondary }
        ]}>
          {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {isMyMessage && getMessageStatusIcon(message)}
      </View>
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
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageTime: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  statusIcon: {
    marginLeft: SPACING.xs,
  },
});