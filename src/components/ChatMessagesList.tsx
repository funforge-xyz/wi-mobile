
import { useRef, useEffect } from 'react';
import { FlatList } from 'react-native';
import { SPACING } from '../config/constants';
import ChatMessage from './ChatMessage';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: Date;
  isFirstMessage?: boolean;
}

interface ChatMessagesListProps {
  messages: Message[];
  currentUserId: string;
  currentTheme: any;
}

export default function ChatMessagesList({
  messages,
  currentUserId,
  currentTheme,
}: ChatMessagesListProps) {
  const flatListRef = useRef<FlatList>(null);

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatMessage
      message={item}
      isMyMessage={item.senderId === currentUserId}
      currentTheme={currentTheme}
    />
  );

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={renderMessage}
      style={styles.messagesList}
      contentContainerStyle={styles.messagesContent}
      onContentSizeChange={() => {
        if (messages.length > 0) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      }}
    />
  );
}

const styles = {
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
};
