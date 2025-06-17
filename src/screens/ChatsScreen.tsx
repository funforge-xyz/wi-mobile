import React, { useState, useEffect } from 'react';
import { FlatList, RefreshControl, AppState, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import { useTranslation } from 'react-i18next';
import ChatsHeader from '../components/ChatsHeader';
import ChatsTabs from '../components/ChatsTabs';
import ConnectionRequestItem from '../components/ConnectionRequestItem';
import ConnectionItem from '../components/ConnectionItem';
import ChatsEmptyState from '../components/ChatsEmptyState';
import ChatsSkeleton from '../components/ChatsSkeleton';
import RequestsSkeleton from '../components/RequestsSkeleton';
import BlockUserConfirmationModal from '../components/BlockUserConfirmationModal';
import { chatsStyles } from '../styles/ChatsStyles';
import {
  ConnectionRequest,
  Connection,
  updateUserLastSeen,
  formatTimeAgo,
  handleReplyToRequest,
  handleDeclineRequest,
  handleStartChat,
  setupRealtimeListeners,
  blockUser,
} from '../utils/chatsUtils';

export default function ChatsScreen({ navigation }: any) {
  const [showRequests, setShowRequests] = useState(false);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const currentTheme = {
    background: isDarkMode ? COLORS.darkBackground : COLORS.background,
    surface: isDarkMode ? COLORS.darkSurface : COLORS.surface,
    text: isDarkMode ? COLORS.darkText : COLORS.text,
    textSecondary: isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary,
    border: isDarkMode ? COLORS.darkBorder : COLORS.border,
  };

  // Update lastSeen when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      updateUserLastSeen();
    }, [])
  );

  useEffect(() => {
    let unsubscribeRequests: (() => void) | null = null;
    let unsubscribeConnections: (() => void) | null = null;

    const initializeListeners = async () => {
      const { unsubscribeRequests: reqUnsub, unsubscribeConnections: connUnsub } = 
        await setupRealtimeListeners(setConnectionRequests, setConnections, setLoading);

      unsubscribeRequests = reqUnsub;
      unsubscribeConnections = connUnsub;
    };

    initializeListeners();

    // Update lastSeen every 30 seconds while app is active
    const lastSeenInterval = setInterval(() => {
      if (AppState.currentState === 'active') {
        updateUserLastSeen();
      }
    }, 30000);

    // Handle app state changes to update lastSeen
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        updateUserLastSeen();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Update lastSeen when app goes to background to show user as offline
        updateUserLastSeen();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup listeners on unmount
    return () => {
      if (unsubscribeRequests) unsubscribeRequests();
      if (unsubscribeConnections) unsubscribeConnections();
      clearInterval(lastSeenInterval);
      appStateSubscription?.remove();
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Real-time listeners will automatically update data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatTime = (date: Date) => formatTimeAgo(date, t);

  const onReplyToRequest = (request: ConnectionRequest) => {
    handleReplyToRequest(request, navigation);
  };

  const onDeclineRequest = (request: ConnectionRequest) => {
    // Create a wrapper function that matches the expected signature
    const translateWrapper = (key: string, fallback?: string) => {
      return fallback ? t(key, fallback) : t(key);
    };
    handleDeclineRequest(request, translateWrapper);
  };

  const onStartChat = (connection: Connection) => {
    handleStartChat(connection, navigation);
  };

  const onBlockUser = (connection: Connection) => {
    setSelectedConnection(connection);
    setShowBlockModal(true);
  };

  const handleConfirmBlock = async () => {
    if (selectedConnection) {
      try {
        await blockUser(selectedConnection.userId, selectedConnection.id);
        Alert.alert(t('common.done'), t('userProfile.userBlocked'));
      } catch (error) {
        Alert.alert('Error', t('userProfile.failedToBlock'));
      }
    }
    setShowBlockModal(false);
    setSelectedConnection(null);
  };

  const handleCancelBlock = () => {
    setShowBlockModal(false);
    setSelectedConnection(null);
  };

  const renderRequestItem = ({ item }: { item: ConnectionRequest }) => (
    <ConnectionRequestItem
      item={item}
      onReply={onReplyToRequest}
      onDecline={onDeclineRequest}
      formatTimeAgo={formatTime}
      currentTheme={currentTheme}
    />
  );

  const renderConnectionItem = ({ item }: { item: Connection }) => (
    <ConnectionItem
      item={item}
      onStartChat={onStartChat}
      onBlock={onBlockUser}
      formatTimeAgo={formatTime}
      currentTheme={currentTheme}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={[chatsStyles.container, { backgroundColor: currentTheme.background }]}>
        <ChatsHeader
          title={t('chats.title')}
          onNotificationPress={() => navigation.navigate('Notifications')}
          currentTheme={currentTheme}
        />

        <ChatsTabs
          showRequests={showRequests}
          onTabChange={setShowRequests}
          requestsCount={connectionRequests.length}
          chatsLabel={t('navigation.chats')}
          requestsLabel={t('chats.requests', 'Requests')}
          currentTheme={currentTheme}
        />

        {showRequests ? (
          <RequestsSkeleton count={3} />
        ) : (
          <ChatsSkeleton count={5} />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[chatsStyles.container, { backgroundColor: currentTheme.background }]}>
      <ChatsHeader
        title={t('chats.title')}
        onNotificationPress={() => navigation.navigate('Notifications')}
        currentTheme={currentTheme}
      />

      <ChatsTabs
        showRequests={showRequests}
        onTabChange={setShowRequests}
        requestsCount={connectionRequests.length}
        chatsLabel={t('navigation.chats')}
        requestsLabel={t('chats.requests', 'Requests')}
        currentTheme={currentTheme}
      />

      <FlatList
        data={showRequests ? connectionRequests : connections}
        keyExtractor={(item) => item.id}
        renderItem={showRequests ? renderRequestItem : renderConnectionItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <ChatsEmptyState
            showRequests={showRequests}
            currentTheme={currentTheme}
            t={t}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          (showRequests ? connectionRequests : connections).length === 0
            ? chatsStyles.emptyContainer
            : chatsStyles.listContent
        }
      />

      <BlockUserConfirmationModal
        visible={showBlockModal}
        onConfirm={handleConfirmBlock}
        onCancel={handleCancelBlock}
        currentTheme={currentTheme}
      />
    </SafeAreaView>
  );
}