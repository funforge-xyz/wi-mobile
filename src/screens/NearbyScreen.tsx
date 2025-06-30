import { useState, useEffect } from 'react';
import {
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../hooks/redux';
import NearbySkeleton from '../components/NearbySkeleton';
import NearbyHeader from '../components/NearbyHeader';
import NearbyUserItem from '../components/NearbyUserItem';
import NearbyEmptyState from '../components/NearbyEmptyState';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/NearbyStyles';
import { getTheme } from '../theme';
import { NearbyUser, loadNearbyUsers, handleMessageUser } from '../utils/nearbyUtils';

export default function NearbyScreen({ navigation }: any) {
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const currentTheme = getTheme(isDarkMode);

  useEffect(() => {
    loadData();
  }, []);

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

  const loadData = async () => {
    try {
      setLoading(true);
      await loadNearbyUsersData();
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyUsersData = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const users = await loadNearbyUsers(currentUser.uid);
      setNearbyUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      throw error;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

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