
import { useRef, useEffect, useState } from 'react';
import { FlatList, ActivityIndicator, View } from 'react-native';
import { SPACING, COLORS } from '../config/constants';
import ChatMessage from './ChatMessage';

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

interface ChatMessagesListProps {
  messages: Message[];
  currentUserId: string;
  currentTheme: any;
  onLoadMore?: () => void;
  hasMoreMessages?: boolean;
  loadingMore?: boolean;
}

export default function ChatMessagesList({
  messages,
  currentUserId,
  currentTheme,
  onLoadMore,
  hasMoreMessages = false,
  loadingMore = false,
}: ChatMessagesListProps) {
  const flatListRef = useRef<FlatList>(null);
  const [isScrollingUp, setIsScrollingUp] = useState(false);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => (
    <ChatMessage
      message={item}
      isMyMessage={item.senderId === currentUserId}
      currentTheme={currentTheme}
    />
  );

  const renderHeader = () => {
    if (!hasMoreMessages || !loadingMore) return null;
    
    return (
      <View style={styles.loadingHeader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const scrollPosition = contentOffset.y;
    const isNearTop = scrollPosition < 100;
    
    // Load more messages when scrolled close to top
    if (isNearTop && hasMoreMessages && !loadingMore && onLoadMore) {
      console.log('Triggering load more - scroll position:', scrollPosition);
      onLoadMore();
    }
  };

  useEffect(() => {
    // Only scroll to bottom on initial load or when a new message is sent/received
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const now = new Date();
      const messageTime = lastMessage.createdAt;
      const timeDiff = now.getTime() - messageTime.getTime();
      
      // Only auto-scroll for very recent messages (new messages)
      if (timeDiff < 2000) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 50);
      }
    }
  }, [messages.length]);

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      renderItem={renderMessage}
      style={styles.messagesList}
      contentContainerStyle={styles.messagesContent}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      ListHeaderComponent={renderHeader}
      
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
  loadingHeader: {
    paddingVertical: SPACING.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};
