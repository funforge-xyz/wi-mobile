import { useEffect, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
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
  const { users, loading, refreshing, loadingMore, hasMore, error, currentPage } = useAppSelector((state) => state.nearby);
  const currentUser = useAppSelector((state) => state.user.user);
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

      if (!currentUser) {
        console.log('No current user found');
        return;
      }

      console.log('Loading nearby users for user:', currentUser.uid);
      
      const result = await dispatch(loadNearbyUsers({ 
        currentUserId: currentUser.uid, 
        reset,
        page: reset ? 0 : currentPage
      })).unwrap();
      
      console.log('Successfully loaded nearby users:', result);
    } catch (error) {
      console.error('Error loading nearby users:', error);
      // Don't dispatch setError here since the thunk already handles it
    }
  };

  const onRefresh = async () => {
    dispatch(setRefreshing(true));
    await loadData(true);
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      await dispatch(loadNearbyUsers({ 
        currentUserId: currentUser.uid, 
        reset: false, 
        page: currentPage + 1
      })).unwrap();
    } catch (error) {
      console.error('Error loading more users:', error);
    }
  }, [dispatch, loadingMore, hasMore, currentPage]);

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

  const renderUserItem = ({ item, index }: { item: NearbyUser; index: number }) => (
    <NearbyUserItem
      user={item}
      currentTheme={currentTheme}
      onPress={handleUserPress}
      isLastItem={index === users.length - 1}
      navigation={navigation}
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

      {loading && !refreshing ? (
        <NearbySkeleton count={5} />
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: currentTheme.text, textAlign: 'center', marginBottom: 16 }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => loadData(true)}
            style={{
              backgroundColor: currentTheme.primary,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
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