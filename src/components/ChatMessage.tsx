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
      // Sending/Not delivered - clock icon
      return (
        <Ionicons 
          name="time-outline" 
          size={14} 
          color="#ffffff70" 
        />
      );
    } else if (message.deliveredAt && !message.seenAt) {
      // Delivered but not seen - single check
      return (
        <Ionicons 
          name="checkmark" 
          size={16} 
          color="#ffffff90" 
        />
      );
    } else if (message.seenAt) {
      // Seen - double check (blue)
      return (
        <View style={styles.doubleCheck}>
          <Ionicons 
            name="checkmark" 
            size={16} 
            color="#4FC3F7" 
            style={styles.firstCheck}
          />
          <Ionicons 
            name="checkmark" 
            size={16} 
            color="#4FC3F7" 
            style={styles.secondCheck}
          />
        </View>
      );
    }
    return null;
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
    minWidth: 120, // Ensure minimum width for timestamp
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
  doubleCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 20,
  },
  firstCheck: {
    position: 'absolute',
    left: 0,
  },
  secondCheck: {
    position: 'absolute',
    left: 6,
  },
});