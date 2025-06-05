
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import { Settings } from '../services/storage';
import { authService } from '../services/auth';
import { collection, getDocs, doc, getDoc, query, orderBy, limit } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';

interface NearbyUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio: string;
  isOnline?: boolean;
}

interface NearbyPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  mediaURL?: string;
  mediaType?: 'image' | 'video';
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
  allowLikes: boolean;
  allowComments: boolean;
}

export default function NearbyScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'people' | 'posts'>('people');
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [nearbyPosts, setNearbyPosts] = useState<NearbyPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'people') {
        await loadNearbyUsers();
      } else {
        await loadNearbyPosts();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyUsers = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();
      const usersCollection = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersCollection);

      const users: NearbyUser[] = [];
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        // Exclude current user
        if (doc.id !== currentUser.uid) {
          users.push({
            id: doc.id,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            photoURL: userData.photoURL || '',
            bio: userData.bio || '',
            isOnline: Math.random() > 0.5, // Mock online status
          });
        }
      });

      setNearbyUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadNearbyPosts = async () => {
    try {
      const firestore = getFirestore();
      const postsCollection = collection(firestore, 'posts');
      const postsQuery = query(postsCollection, orderBy('createdAt', 'desc'), limit(20));
      const postsSnapshot = await getDocs(postsQuery);

      const posts: NearbyPost[] = [];

      for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data();
        
        // Get author information
        const authorDoc = await getDoc(doc(firestore, 'users', postData.authorId));
        const authorData = authorDoc.exists() ? authorDoc.data() : {};

        // Get likes count
        const likesCollection = collection(firestore, 'posts', postDoc.id, 'likes');
        const likesSnapshot = await getDocs(likesCollection);

        // Get comments count
        const commentsCollection = collection(firestore, 'posts', postDoc.id, 'comments');
        const commentsSnapshot = await getDocs(commentsCollection);

        posts.push({
          id: postDoc.id,
          authorId: postData.authorId,
          authorName: authorData.firstName && authorData.lastName 
            ? `${authorData.firstName} ${authorData.lastName}` 
            : 'Anonymous User',
          authorPhotoURL: authorData.photoURL || '',
          content: postData.content || '',
          mediaURL: postData.mediaURL || '',
          mediaType: postData.mediaType || 'image',
          createdAt: postData.createdAt?.toDate() || new Date(),
          likesCount: likesSnapshot.size,
          commentsCount: commentsSnapshot.size,
          allowLikes: postData.allowLikes !== false,
          allowComments: postData.allowComments !== false,
        });
      }

      setNearbyPosts(posts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUserPress = (user: NearbyUser) => {
    // Navigate to user profile
    navigation.navigate('Profile', { userId: user.id });
  };

  const handleConnectUser = (user: NearbyUser) => {
    Alert.alert(
      'Connect',
      `Send a connection request to ${user.firstName} ${user.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Connect', 
          onPress: () => {
            // TODO: Implement connection logic
            Alert.alert('Success', 'Connection request sent!');
          }
        },
      ]
    );
  };

  const handlePostPress = (post: NearbyPost) => {
    // Navigate to single post screen
    navigation.navigate('SinglePost', { postId: post.id });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays}d ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours}h ago`;
    } else {
      return 'Just now';
    }
  };

  const renderUserItem = ({ item }: { item: NearbyUser }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: currentTheme.surface }]}
      onPress={() => handleUserPress(item)}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: item.photoURL || 'https://via.placeholder.com/50' }}
            style={styles.avatar}
          />
          {item.isOnline && <View style={[styles.onlineIndicator, { borderColor: currentTheme.surface }]} />}
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: currentTheme.text }]}>
            {item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : 'Anonymous User'}
          </Text>
          <Text style={[styles.userEmail, { color: currentTheme.textSecondary }]}>{item.email}</Text>
          {item.bio ? (
            <Text style={[styles.userBio, { color: currentTheme.textSecondary }]} numberOfLines={2}>
              {item.bio}
            </Text>
          ) : null}
        </View>
      </View>
      <TouchableOpacity
        style={styles.connectButton}
        onPress={() => handleConnectUser(item)}
      >
        <Ionicons name="person-add-outline" size={20} color={COLORS.primary} />
        <Text style={[styles.connectText, { color: COLORS.primary }]}>Connect</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderPostItem = ({ item }: { item: NearbyPost }) => (
    <TouchableOpacity
      style={[styles.postItem, { backgroundColor: currentTheme.surface }]}
      onPress={() => handlePostPress(item)}
    >
      <View style={styles.postHeader}>
        <View style={styles.postAuthorInfo}>
          <Image
            source={{ uri: item.authorPhotoURL || 'https://via.placeholder.com/40' }}
            style={styles.postAuthorAvatar}
          />
          <View>
            <Text style={[styles.postAuthorName, { color: currentTheme.text }]}>
              {item.authorName}
            </Text>
            <Text style={[styles.postTime, { color: currentTheme.textSecondary }]}>
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {item.content ? (
        <Text style={[styles.postContent, { color: currentTheme.text }]} numberOfLines={3}>
          {item.content}
        </Text>
      ) : null}

      {item.mediaURL ? (
        <Image
          source={{ uri: item.mediaURL }}
          style={styles.postMedia}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.postStats}>
        {item.allowLikes && (
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={16} color={currentTheme.textSecondary} />
            <Text style={[styles.statText, { color: currentTheme.textSecondary }]}>
              {item.likesCount}
            </Text>
          </View>
        )}
        {item.allowComments && (
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={16} color={currentTheme.textSecondary} />
            <Text style={[styles.statText, { color: currentTheme.textSecondary }]}>
              {item.commentsCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={activeTab === 'people' ? 'people-outline' : 'document-text-outline'}
        size={64}
        color={currentTheme.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
        {activeTab === 'people' ? 'No People Found' : 'No Posts Found'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
        {activeTab === 'people' 
          ? 'There are no people to show right now.'
          : 'There are no posts to show right now.'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Nearby</Text>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: currentTheme.surface }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'people' && styles.activeTab]}
          onPress={() => setActiveTab('people')}
        >
          <Text style={[
            styles.tabText, 
            { color: currentTheme.textSecondary }, 
            activeTab === 'people' && styles.activeTabText
          ]}>
            People
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[
            styles.tabText, 
            { color: currentTheme.textSecondary }, 
            activeTab === 'posts' && styles.activeTabText
          ]}>
            Posts
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
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
      )}
    </SafeAreaView>
  );
}

const lightTheme = {
  background: COLORS.background,
  surface: COLORS.surface,
  text: COLORS.text,
  textSecondary: COLORS.textSecondary,
  border: COLORS.border,
};

const darkTheme = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary + '20',
  },
  tabText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
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
    backgroundColor: COLORS.success,
    borderWidth: 2,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  userBio: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 16,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  connectText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.xs,
  },
  postItem: {
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  postAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAuthorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },
  postAuthorName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  postTime: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  postContent: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  postMedia: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
});
