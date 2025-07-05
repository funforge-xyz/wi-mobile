import { useState, useEffect, useCallback } from 'react';
import { FlatList, RefreshControl, AppState, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
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
import { createChatsStyles, getTheme } from '../styles/ChatsStyles';
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const chatsStyles = createChatsStyles(isDarkMode);

  const currentTheme = getTheme(isDarkMode);

  // Update lastSeen when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      updateUserLastSeen();
    }, [])
  );

  useEffect(() => {
    let unsubscribeRequests: (() => void) | null = null;
    let unsubscribeConnections: (() => void) | null = null;
    let unsubscribeAuth: (() => void) | null = null;

    const initializeListeners = async () => {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();

      // Set up auth state listener to clear data on logout
      unsubscribeAuth = auth.onAuthStateChanged((user) => {
        if (!user) {
          // User logged out, clear local state
          setConnectionRequests([]);
          setConnections([]);
          setLoading(true);
          return;
        }

        // User is logged in, set up data listeners
        setupRealtimeListeners(setConnectionRequests, setConnections, setLoading)
          .then(({ unsubscribeRequests: reqUnsub, unsubscribeConnections: connUnsub }) => {
            unsubscribeRequests = reqUnsub;
            unsubscribeConnections = connUnsub;
          });
      });
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
      if (unsubscribeAuth) unsubscribeAuth();
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
        setShowBlockModal(false);
        setShowSuccessModal(true);
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

      {showRequests ? (
        <FlatList<ConnectionRequest>
          data={connectionRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequestItem}
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
            connectionRequests.length === 0
              ? chatsStyles.emptyContainer
              : chatsStyles.listContent
          }
        />
      ) : (
        <FlatList<Connection>
          data={connections}
          keyExtractor={(item) => item.id}
          renderItem={renderConnectionItem}
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
            connections.length === 0
              ? chatsStyles.emptyContainer
              : chatsStyles.listContent
          }
        />
      )}

      <BlockUserConfirmationModal
        visible={showBlockModal}
        onConfirm={handleConfirmBlock}
        onCancel={handleCancelBlock}
        currentTheme={currentTheme}
      />
    </SafeAreaView>
  );
}