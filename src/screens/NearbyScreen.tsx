import { useEffect, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import NearbySkeleton from '../components/NearbySkeleton';
import NearbyHeader from '../components/NearbyHeader';
import NearbyUserItem from '../components/NearbyUserItem';
import NearbyEmptyState from '../components/NearbyEmptyState';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/NearbyStyles';
import { getTheme } from '../theme';
import { handleMessageUser } from '../utils/nearbyUtils';
import { loadNearbyUsers, setRefreshing } from '../store/nearbySlice';
import type { NearbyUser } from '../store/nearbySlice';

export default function NearbyScreen({ navigation, route }: any) {
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { users, loading, refreshing, loadingMore, lastDoc, hasMore, error } = useAppSelector((state) => state.nearby);
  const { t } = useTranslation();

  const currentTheme = getTheme(isDarkMode);

  // Initial load on mount
  useEffect(() => {
    loadData();
  }, []);

  // Clear nearby data when auth state changes (user logs out/in)
  useEffect(() => {
    const setupAuthListener = async () => {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();

      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
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
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      await dispatch(loadNearbyUsers({ 
        currentUserId: currentUser.uid, 
        reset,
        lastDoc: reset ? null : lastDoc 
      })).unwrap();
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const onRefresh = async () => {
    dispatch(setRefreshing(true));
    await loadData(true);
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      await loadData(false);
    } catch (error) {
      console.error('Error loading more users:', error);
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
          data={users}
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
            users.length === 0
              ? styles.emptyContainer
              : styles.listContent
          }
        />
      )}
    </SafeAreaView>
  );
}