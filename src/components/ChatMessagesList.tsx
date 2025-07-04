
import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
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

export default forwardRef<any, ChatMessagesListProps>(function ChatMessagesList({
  messages,
  currentUserId,
  currentTheme,
  onLoadMore,
  hasMoreMessages = false,
  loadingMore = false,
}, ref) {
  const flatListRef = useRef<FlatList>(null);
  const [isScrollingUp, setIsScrollingUp] = useState(false);

  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }));

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

  const handleEndReached = () => {
    // For inverted list, onEndReached triggers when user scrolls to older messages
    if (hasMoreMessages && !loadingMore && onLoadMore) {
      console.log('Triggering load more via onEndReached');
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
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.1}
      ListFooterComponent={renderFooter}
      inverted
      showsVerticalScrollIndicator={false}
    />
  );
});

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
