
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';

interface NearbyUser {
  id: string;
  displayName: string;
  photoURL?: string;
  distance: number;
  lastSeen: Date;
  isOnline: boolean;
}

interface NearbyPost {
  id: string;
  userId: string;
  userName: string;
  content: string;
  distance: number;
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
}

export default function NearbyScreen() {
  const [activeTab, setActiveTab] = useState<'people' | 'posts'>('people');
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [nearbyPosts, setNearbyPosts] = useState<NearbyPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  // Mock data
  const mockUsers: NearbyUser[] = [
    {
      id: '1',
      displayName: 'Alice Johnson',
      photoURL: 'https://via.placeholder.com/50',
      distance: 0.2,
      lastSeen: new Date(),
      isOnline: true,
    },
    {
      id: '2',
      displayName: 'Bob Smith',
      photoURL: 'https://via.placeholder.com/50',
      distance: 0.5,
      lastSeen: new Date(Date.now() - 300000),
      isOnline: false,
    },
    {
      id: '3',
      displayName: 'Carol Davis',
      photoURL: 'https://via.placeholder.com/50',
      distance: 0.8,
      lastSeen: new Date(Date.now() - 600000),
      isOnline: true,
    },
  ];

  const mockPosts: NearbyPost[] = [
    {
      id: '1',
      userId: '1',
      userName: 'Alice Johnson',
      content: 'Great coffee at the local cafe! Anyone want to join?',
      distance: 0.2,
      createdAt: new Date(),
      likesCount: 5,
      commentsCount: 2,
    },
    {
      id: '2',
      userId: '4',
      userName: 'David Wilson',
      content: 'Lost dog in the area - brown labrador, very friendly!',
      distance: 0.3,
      createdAt: new Date(Date.now() - 1800000),
      likesCount: 12,
      commentsCount: 8,
    },
  ];

  useEffect(() => {
    loadNearbyData();
  }, []);

  const loadNearbyData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNearbyUsers(mockUsers);
      setNearbyPosts(mockPosts);
    } catch (error) {
      Alert.alert('Error', 'Failed to load nearby data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNearbyData();
    setRefreshing(false);
  };

  const handleUserPress = (user: NearbyUser) => {
    Alert.alert('User Profile', `View ${user.displayName}'s profile`);
  };

  const handleMessageUser = (user: NearbyUser) => {
    Alert.alert('Message', `Send message to ${user.displayName}`);
  };

  const renderUserItem = ({ item }: { item: NearbyUser }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item)}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: item.photoURL || 'https://via.placeholder.com/50' }}
            style={styles.avatar}
          />
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <Text style={styles.userDistance}>{item.distance} km away</Text>
          <Text style={styles.userLastSeen}>
            {item.isOnline ? 'Online' : `Last seen ${item.lastSeen.toLocaleTimeString()}`}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.messageButton}
        onPress={() => handleMessageUser(item)}
      >
        <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderPostItem = ({ item }: { item: NearbyPost }) => (
    <View style={styles.postItem}>
      <View style={styles.postHeader}>
        <Text style={styles.postUserName}>{item.userName}</Text>
        <Text style={styles.postDistance}>{item.distance} km away</Text>
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
      <View style={styles.postActions}>
        <View style={styles.postAction}>
          <Ionicons name="heart-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.postActionText}>{item.likesCount}</Text>
        </View>
        <View style={styles.postAction}>
          <Ionicons name="chatbubble-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.postActionText}>{item.commentsCount}</Text>
        </View>
        <Text style={styles.postTime}>
          {item.createdAt.toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name={activeTab === 'people' ? 'people-outline' : 'location-outline'}
        size={64}
        color={COLORS.textSecondary}
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'people' ? 'No People Nearby' : 'No Posts Nearby'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'people'
          ? 'Check back later to see who\'s around you'
          : 'Be the first to post something in your area!'
        }
      </Text>
    </View>
  );

  if (!locationEnabled) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="location-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.permissionTitle}>Location Permission Required</Text>
          <Text style={styles.permissionSubtitle}>
            Enable location services to discover people and posts around you
          </Text>
          <TouchableOpacity
            style={styles.enableButton}
            onPress={() => setLocationEnabled(true)}
          >
            <Text style={styles.enableButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby</Text>
        <TouchableOpacity>
          <Ionicons name="options-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'people' && styles.activeTab]}
          onPress={() => setActiveTab('people')}
        >
          <Text style={[styles.tabText, activeTab === 'people' && styles.activeTabText]}>
            People
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            Posts
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'people' ? nearbyUsers : nearbyPosts}
        keyExtractor={(item) => item.id}
        renderItem={activeTab === 'people' ? renderUserItem : renderPostItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          (activeTab === 'people' ? nearbyUsers : nearbyPosts).length === 0
            ? styles.emptyContainer
            : styles.listContent
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  listContent: {
    paddingVertical: SPACING.sm,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: 2,
  },
  userDistance: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.primary,
    marginBottom: 2,
  },
  userLastSeen: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  messageButton: {
    padding: SPACING.sm,
  },
  postItem: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    padding: SPACING.md,
    borderRadius: 12,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  postUserName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  postDistance: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.primary,
  },
  postContent: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  postActionText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  postTime: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginLeft: 'auto',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  permissionTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  permissionSubtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  enableButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  enableButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: 'white',
  },
});
