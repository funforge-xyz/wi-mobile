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
import BlockUserSuccessModal from '../components/BlockUserSuccessModal';
import DeclineRequestConfirmationModal from '../components/DeclineRequestConfirmationModal';
import DeclineRequestSuccessModal from '../components/DeclineRequestSuccessModal';
import { createChatsStyles, getTheme } from '../styles/ChatsStyles';
import {
  ConnectionRequest,
  Connection,
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
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showDeclineSuccessModal, setShowDeclineSuccessModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ConnectionRequest | null>(null);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const chatsStyles = createChatsStyles(isDarkMode);

  const currentTheme = getTheme(isDarkMode);

  

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

    // Cleanup listeners on unmount
    return () => {
      if (unsubscribeRequests) unsubscribeRequests();
      if (unsubscribeConnections) unsubscribeConnections();
      if (unsubscribeAuth) unsubscribeAuth();
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

  const handleDeclineRequest = (request: ConnectionRequest) => {
    setSelectedRequest(request);
    setShowDeclineModal(true);
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

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setSelectedConnection(null);
    // Navigate to NearbyScreen (People tab)
    navigation.navigate('Root', { 
      screen: 'People',
      params: {
        screen: 'Nearby',
        params: {
          refetchAfterBlock: true,
        }
      }
    });
  };

  const handleCancelBlock = () => {
    setShowBlockModal(false);
    setSelectedConnection(null);
  };

  const confirmDeclineRequest = async () => {
    if (!selectedRequest) return;

    try {
      const { getAuth, getFirestore } = await import('../services/firebase');
      const { deleteDoc, doc } = await import('firebase/firestore');

      const auth = getAuth();
      const firestore = getFirestore();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      await deleteDoc(doc(firestore, 'connectionRequests', selectedRequest.id));

      setConnectionRequests(prev => prev.filter(req => req.id !== selectedRequest.id));

      setShowDeclineModal(false);
      setShowDeclineSuccessModal(true);
    } catch (error) {
      console.error('Error declining request:', error);
      Alert.alert('Error', 'Failed to decline request');
      setShowDeclineModal(false);
    }
    setSelectedRequest(null);
  };

  const handleBlockSuccessClose = () => {
    setShowSuccessModal(false);
    setSelectedConnection(null);
    // Navigate to NearbyScreen (People tab)
    navigation.navigate('Root', { 
      screen: 'People',
      params: {
        screen: 'Nearby',
        params: {
          refetchAfterBlock: true,
        }
      }
    });
  };

  const handleDeclineSuccessClose = () => {
    setShowDeclineSuccessModal(false);
  };

  const renderRequestItem = ({ item, index }: { item: ConnectionRequest; index: number }) => (
    <ConnectionRequestItem
      item={item}
      onReply={onReplyToRequest}
      onDecline={handleDeclineRequest}
      formatTimeAgo={formatTime}
      currentTheme={currentTheme}
      isLastItem={index === connectionRequests.length - 1}
    />
  );

  const renderConnectionItem = ({ item, index }: { item: Connection; index: number }) => (
    <ConnectionItem
      item={item}
      onStartChat={onStartChat}
      onBlock={onBlockUser}
      formatTimeAgo={formatTime}
      currentTheme={currentTheme}
      isLastItem={index === connections.length - 1}
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

      <BlockUserSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        currentTheme={currentTheme}
      />

      <DeclineRequestConfirmationModal
        visible={showDeclineModal}
        onConfirm={confirmDeclineRequest}
        onCancel={() => {
          setShowDeclineModal(false);
          setSelectedRequest(null);
        }}
        userName={selectedRequest ? 
          `${selectedRequest.firstName} ${selectedRequest.lastName}` : 
          'this user'
        }
        currentTheme={currentTheme}
      />

      <DeclineRequestSuccessModal
        visible={showDeclineSuccessModal}
        onClose={handleDeclineSuccessClose}
        currentTheme={currentTheme}
      />
    </SafeAreaView>
  );
}