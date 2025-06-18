
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { useAppSelector } from '../hooks/redux';
import { SPACING } from '../config/constants';

interface ChatsSkeletonProps {
  count?: number;
}

export default function ChatsSkeleton({ count = 5 }: ChatsSkeletonProps) {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  const renderSkeletonChat = (index: number) => (
    <View key={index} style={[styles.chatContainer, { backgroundColor: currentTheme.surface }]}>
      <View style={styles.chatInfo}>
        {/* Avatar */}
        <SkeletonLoader
          width={50}
          height={50}
          borderRadius={25}
          style={styles.avatar}
        />
        
        {/* Chat details */}
        <View style={styles.chatDetails}>
          <View style={styles.chatHeader}>
            <SkeletonLoader
              width={140}
              height={16}
              borderRadius={8}
              style={styles.chatName}
            />
            <SkeletonLoader
              width={60}
              height={12}
              borderRadius={6}
              style={styles.timestamp}
            />
          </View>
          <SkeletonLoader
            width={200}
            height={14}
            borderRadius={7}
            style={styles.lastMessage}
          />
        </View>
      </View>
      
      {/* Unread badge */}
      <SkeletonLoader
        width={20}
        height={20}
        borderRadius={10}
        style={styles.unreadBadge}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => renderSkeletonChat(index))}
    </View>
  );
}

const lightTheme = {
  surface: '#FFFFFF',
};

const darkTheme = {
  surface: '#1E1E1E',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  chatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
  },
  chatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: SPACING.md,
  },
  chatDetails: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  chatName: {},
  timestamp: {},
  lastMessage: {},
  unreadBadge: {},
});
