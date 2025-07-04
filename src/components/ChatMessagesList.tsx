
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

  const renderFooter = () => {
    if (!hasMoreMessages || !loadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollPosition = contentOffset.y;
    // For inverted list, check if we're near the bottom (which shows older messages)
    const isNearBottom = scrollPosition >= (contentSize.height - layoutMeasurement.height - 100);
    
    // Load more messages when scrolled close to bottom (older messages)
    if (isNearBottom && hasMoreMessages && !loadingMore && onLoadMore) {
      console.log('Triggering load more - scroll position:', scrollPosition);
      onLoadMore();
    }
  };

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
      ListFooterComponent={renderFooter}
      inverted
      showsVerticalScrollIndicator={false}
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
  loadingFooter: {
    paddingVertical: SPACING.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};
