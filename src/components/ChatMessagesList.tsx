
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
    
    setIsScrollingUp(isScrollingToTop);
    
    // Load more messages when scrolled close to top
    if (isScrollingToTop && hasMoreMessages && !loadingMore && onLoadMore) {
      onLoadMore();
    }
  };

  useEffect(() => {
    // Only auto-scroll to bottom for new messages, not when loading older ones
    if (messages.length > 0 && !isScrollingUp) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isScrollingUp]);

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
        if (messages.length > 0 && !isScrollingUp) {
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
  loadingHeader: {
    paddingVertical: SPACING.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};
