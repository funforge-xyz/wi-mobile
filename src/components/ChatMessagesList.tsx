
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

  const renderMessage = ({ item }: { item: Message }) => (
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
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isScrollingToTop = contentOffset.y < 100;
    const isAtBottom = contentOffset.y >= (contentSize.height - layoutMeasurement.height - 100);
    
    setIsScrollingUp(isScrollingToTop && !isAtBottom);
    
    // Load more messages when scrolled close to top
    if (isScrollingToTop && hasMoreMessages && !loadingMore && onLoadMore) {
      onLoadMore();
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom for new messages, but not when loading older ones
    if (messages.length > 0) {
      // Check if the last message is recent (within last 5 seconds) to determine if it's a new message
      const lastMessage = messages[messages.length - 1];
      const now = new Date();
      const messageTime = lastMessage.createdAt;
      const timeDiff = now.getTime() - messageTime.getTime();
      
      // If it's a very recent message (likely just sent/received), scroll to bottom
      if (timeDiff < 5000 || !isScrollingUp) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
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
      onScroll={handleScroll}
      scrollEventThrottle={16}
      ListHeaderComponent={renderHeader}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 100,
      }}
      onContentSizeChange={() => {
        // Always scroll to end when content size changes (new message added)
        if (messages.length > 0) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 50);
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
  loadingHeader: {
    paddingVertical: SPACING.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};
