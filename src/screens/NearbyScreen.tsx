
import { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAppSelector } from '../hooks/redux';
import NearbySkeleton from '../components/NearbySkeleton';
import NearbyHeader from '../components/NearbyHeader';
import NearbyUserItem from '../components/NearbyUserItem';
import NearbyEmptyState from '../components/NearbyEmptyState';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/NearbyStyles';
import { getTheme } from '../theme';
import { NearbyUser, loadNearbyUsers, handleMessageUser } from '../utils/nearbyUtils';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export default function NearbyScreen({ navigation, route }: any) {
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  // Get refetch parameter from route params
  const shouldRefetchAfterBlock = route?.params?.refetchAfterBlock;

  const currentTheme = getTheme(isDarkMode);

  useEffect(() => {
    loadData();
  }, []);

  // Selective refresh when screen comes into focus (for blocked user flow)
  useFocusEffect(
    useCallback(() => {
      // Only refresh if coming from block user flow
      if (shouldRefetchAfterBlock) {
        loadData(true);
      }
    }, [shouldRefetchAfterBlock])
  );

  // Clear the refetch parameter after using it
  useEffect(() => {
    if (shouldRefetchAfterBlock) {
      // Reset the navigation params to prevent unnecessary refetches
      navigation.setParams({ refetchAfterBlock: undefined });
    }
  }, [shouldRefetchAfterBlock, navigation]);

  // Clear local state when auth state changes (user logs out/in)
  useEffect(() => {
    const setupAuthListener = async () => {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) {
          // User logged out, clear local state
          setNearbyUsers([]);
          setLoading(true);
          setLastDoc(null);
          setHasMore(true);
        } else {
          // User logged in, load fresh data
          loadData();
        }
      });

      return unsubscribe;
    };

    let unsubscribe: (() => void) | null = null;
    setupAuthListener().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadData = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setNearbyUsers([]);
        setLastDoc(null);
        setHasMore(true);
      }
      await loadNearbyUsersData(reset);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyUsersData = async (reset: boolean = true) => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const currentLastDoc = reset ? null : lastDoc;
      const result = await loadNearbyUsers(currentUser.uid, currentLastDoc, 50);

      if (reset) {
        setNearbyUsers(result.users);
      } else {
        setNearbyUsers(prev => [...prev, ...result.users]);
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading users:', error);
      throw error;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      await loadNearbyUsersData(false);
    } catch (error) {
      console.error('Error loading more users:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastDoc]);

  const handleUserPress = async (user: NearbyUser) => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to send messages');
        return;
      }

      await handleMessageUser(user, currentUser.uid, navigation);
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat');
    }
  };

  const renderUserItem = ({ item }: { item: NearbyUser }) => (
    <NearbyUserItem
      user={item}
      currentTheme={currentTheme}
      onPress={handleUserPress}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={currentTheme.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <NearbyHeader
        title={t('nearby.title')}
        currentTheme={currentTheme}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      {loading ? (
        <NearbySkeleton count={5} />
      ) : (
        <FlatList
          data={nearbyUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <NearbyEmptyState currentTheme={currentTheme} t={t} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            nearbyUsers.length === 0
              ? styles.emptyContainer
              : styles.listContent
          }
        />
      )}
    </SafeAreaView>
  );
}
