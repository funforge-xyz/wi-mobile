
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/redux';
import { getTheme } from '../theme';
import UserAvatar from '../components/UserAvatar';
import ConnectionsSkeleton from '../components/ConnectionsSkeleton';
import DeleteConnectionConfirmModal from '../components/DeleteConnectionConfirmModal';
import DeleteConnectionSuccessModal from '../components/DeleteConnectionSuccessModal';
import BlockUserConfirmationModal from '../components/BlockUserConfirmationModal';
import BlockUserSuccessModal from '../components/BlockUserSuccessModal';
import { createConnectionsStyles } from '../styles/ConnectionsStyles';

interface Connection {
  id: string;
  participants: string[];
  status: 'active' | 'blocked' | 'pending';
  createdAt: string;
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    photoURL: string;
    thumbnailURL: string;
  };
}

export default function ConnectionsScreen({ navigation }: any) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [filteredConnections, setFilteredConnections] = useState<Connection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showBlockSuccessModal, setShowBlockSuccessModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);

  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();
  const currentTheme = getTheme(isDarkMode);
  const styles = createConnectionsStyles(isDarkMode);

  useEffect(() => {
    loadConnections();
  }, []);

  useEffect(() => {
    filterConnections();
  }, [searchQuery, connections]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const { getAuth, getFirestore } = await import('../services/firebase');
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      const auth = getAuth();
      const firestore = getFirestore();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const connectionsRef = collection(firestore, 'connections');
      const connectionsQuery = query(
        connectionsRef,
        where('participants', 'array-contains', currentUser.uid),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(connectionsQuery);
      const connectionsData: Connection[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const otherUserId = data.participants.find((id: string) => id !== currentUser.uid);
        
        if (otherUserId) {
          // Get other user's data
          const { doc: docRef, getDoc } = await import('firebase/firestore');
          const userDoc = await getDoc(docRef(firestore, 'users', otherUserId));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            connectionsData.push({
              id: doc.id,
              participants: data.participants,
              status: data.status,
              createdAt: data.createdAt,
              otherUser: {
                id: otherUserId,
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                photoURL: userData.photoURL || '',
                thumbnailURL: userData.thumbnailURL || userData.photoURL || '',
              }
            });
          }
        }
      }

      setConnections(connectionsData);
    } catch (error) {
      console.error('Error loading connections:', error);
      Alert.alert('Error', 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const filterConnections = () => {
    if (!searchQuery.trim()) {
      setFilteredConnections(connections);
      return;
    }

    const filtered = connections.filter(connection => {
      const fullName = `${connection.otherUser.firstName} ${connection.otherUser.lastName}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });

    setFilteredConnections(filtered);
  };

  const handleDeleteConnection = (connection: Connection) => {
    setSelectedConnection(connection);
    setShowDeleteModal(true);
  };

  const handleBlockConnection = (connection: Connection) => {
    setSelectedConnection(connection);
    setShowBlockModal(true);
  };

  const confirmDeleteConnection = async () => {
    if (!selectedConnection) return;

    try {
      const { getAuth, getFirestore } = await import('../services/firebase');
      const { collection, query, where, getDocs, deleteDoc, doc } = await import('firebase/firestore');
      
      const auth = getAuth();
      const firestore = getFirestore();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      // Delete the connection
      await deleteDoc(doc(firestore, 'connections', selectedConnection.id));

      // Delete any connection requests between these users
      const requestsRef = collection(firestore, 'connectionRequests');
      
      // Check for requests from current user to other user
      const outgoingQuery = query(
        requestsRef,
        where('fromUserId', '==', currentUser.uid),
        where('toUserId', '==', selectedConnection.otherUser.id)
      );
      
      // Check for requests from other user to current user
      const incomingQuery = query(
        requestsRef,
        where('fromUserId', '==', selectedConnection.otherUser.id),
        where('toUserId', '==', currentUser.uid)
      );

      const [outgoingSnapshot, incomingSnapshot] = await Promise.all([
        getDocs(outgoingQuery),
        getDocs(incomingQuery)
      ]);

      // Delete all found requests
      const deletePromises = [
        ...outgoingSnapshot.docs.map(doc => deleteDoc(doc.ref)),
        ...incomingSnapshot.docs.map(doc => deleteDoc(doc.ref))
      ];

      await Promise.all(deletePromises);

      // Update local state
      setConnections(prev => prev.filter(conn => conn.id !== selectedConnection.id));
      
      setShowDeleteModal(false);
      setShowDeleteSuccessModal(true);
    } catch (error) {
      console.error('Error deleting connection:', error);
      Alert.alert('Error', 'Failed to delete connection');
      setShowDeleteModal(false);
    }
    setSelectedConnection(null);
  };

  const confirmBlockConnection = async () => {
    if (!selectedConnection) return;

    try {
      const { getAuth, getFirestore } = await import('../services/firebase');
      const { addDoc, collection, serverTimestamp, doc, updateDoc } = await import('firebase/firestore');
      
      const auth = getAuth();
      const firestore = getFirestore();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      // Add to blocked users collection
      await addDoc(collection(firestore, 'blockedUsers'), {
        blockedBy: currentUser.uid,
        blockedUser: selectedConnection.otherUser.id,
        blockedAt: serverTimestamp(),
        reason: 'blocked_by_user'
      });

      // Update connection status to blocked
      await updateDoc(doc(firestore, 'connections', selectedConnection.id), {
        status: 'blocked',
        blockedBy: currentUser.uid,
        blockedAt: serverTimestamp()
      });

      // Update local state
      setConnections(prev => prev.filter(conn => conn.id !== selectedConnection.id));
      
      setShowBlockModal(false);
      setShowBlockSuccessModal(true);
    } catch (error) {
      console.error('Error blocking user:', error);
      Alert.alert('Error', 'Failed to block user');
      setShowBlockModal(false);
    }
    setSelectedConnection(null);
  };

  const handleDeleteSuccessClose = () => {
    setShowDeleteSuccessModal(false);
  };

  const handleBlockSuccessClose = () => {
    setShowBlockSuccessModal(false);
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

  const renderConnectionItem = ({ item }: { item: Connection }) => {
    const displayName = item.otherUser.firstName && item.otherUser.lastName 
      ? `${item.otherUser.firstName} ${item.otherUser.lastName}` 
      : 'Anonymous User';

    return (
      <View style={[styles.connectionItem, { backgroundColor: currentTheme.surface }]}>
        <View style={styles.connectionContent}>
          <UserAvatar
            photoURL={item.otherUser.thumbnailURL || item.otherUser.photoURL}
            size={50}
            currentTheme={currentTheme}
          />
          
          <View style={styles.connectionInfo}>
            <Text style={[styles.connectionName, { color: currentTheme.text }]}>
              {displayName}
            </Text>
          </View>

          <View style={styles.connectionActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteConnection(item)}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.blockButton]}
              onPress={() => handleBlockConnection(item)}
            >
              <Ionicons name="ban-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={currentTheme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
        {searchQuery ? t('connections.noMatchingConnections') : t('connections.noConnections')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
        {searchQuery 
          ? t('connections.tryDifferentSearch') 
          : t('connections.connectWithPeople')
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
          {t('connections.title')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: currentTheme.surface }]}>
        <Ionicons name="search" size={20} color={currentTheme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: currentTheme.text }]}
          placeholder={t('connections.searchConnections')}
          placeholderTextColor={currentTheme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ConnectionsSkeleton count={8} />
      ) : (
        <FlatList
          data={filteredConnections}
          keyExtractor={(item) => item.id}
          renderItem={renderConnectionItem}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            filteredConnections.length === 0
              ? styles.emptyListContainer
              : styles.listContent
          }
        />
      )}

      <DeleteConnectionConfirmModal
        visible={showDeleteModal}
        onConfirm={confirmDeleteConnection}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedConnection(null);
        }}
        userName={selectedConnection ? 
          `${selectedConnection.otherUser.firstName} ${selectedConnection.otherUser.lastName}` : 
          'this user'
        }
        currentTheme={currentTheme}
      />

      <DeleteConnectionSuccessModal
        visible={showDeleteSuccessModal}
        onClose={handleDeleteSuccessClose}
        currentTheme={currentTheme}
      />

      <BlockUserConfirmationModal
        visible={showBlockModal}
        onConfirm={confirmBlockConnection}
        onCancel={() => {
          setShowBlockModal(false);
          setSelectedConnection(null);
        }}
        userName={selectedConnection ? 
          `${selectedConnection.otherUser.firstName} ${selectedConnection.otherUser.lastName}` : 
          'this user'
        }
        currentTheme={currentTheme}
      />

      <BlockUserSuccessModal
        visible={showBlockSuccessModal}
        onClose={handleBlockSuccessClose}
        currentTheme={currentTheme}
      />
    </SafeAreaView>
  );
}
