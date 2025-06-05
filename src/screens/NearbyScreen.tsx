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
import { collection, getDocs, doc, getDoc, query, orderBy, limit, where } from 'firebase/firestore';
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

interface ConnectionRequest {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

interface ChatMessage {
  id: string;
  participantId: string;
  participantName: string;
  participantPhotoURL: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
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
  const [activeTab, setActiveTab] = useState<'people' | 'posts' | 'messages' | 'connections'>('people');
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [nearbyPosts, setNearbyPosts] = useState<NearbyPost[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
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
      } else if (activeTab === 'posts') {
        await loadNearbyPosts();
      } else if (activeTab === 'messages') {
        await loadChatMessages();
      } else if (activeTab === 'connections') {
        await loadConnectionRequests();
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
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();
      const postsCollection = collection(firestore, 'posts');
      
      // First, get all posts ordered by creation date
      const postsQuery = query(
        postsCollection,
        orderBy('createdAt', 'desc'),
        limit(50) // Get more posts to filter out current user's posts
      );
      const postsSnapshot = await getDocs(postsQuery);

      const posts: NearbyPost[] = [];
      let postCount = 0;

      for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data();

        // Skip current user's posts
        if (postData.authorId === currentUser.uid) {
          continue;
        }

        // Stop if we have enough posts
        if (postCount >= 20) {
          break;
        }

        // Get author information
        const authorDoc = await getDoc(doc(firestore, 'users', postData.authorId));
        const authorData = authorDoc.exists() ? authorDoc.data() : {};

        // Get likes count
        const likesCollection = collection(firestore, 'posts', postDoc.id, 'likes');
        const likesSnapshot = await getDocs(likesCollection);

        // Get comments count
        const commentsCollection = collection(firestore, 'posts', postDoc.id, 'comments');
        const commentsSnapshot = await getDocs(commentsSnapshot);

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

        postCount++;
      }

      setNearbyPosts(posts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadChatMessages = async () => {
    try {
      // Mock data for now - replace with actual Firebase implementation
      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          participantId: 'user1',
          participantName: 'Alice Johnson',
          participantPhotoURL: '',
          lastMessage: 'Hey! How are you?',
          lastMessageTime: new Date(),
          unreadCount: 2,
        },
        {
          id: '2',
          participantId: 'user2',
          participantName: 'Bob Smith',
          participantPhotoURL: '',
          lastMessage: 'Thanks for connecting!',
          lastMessageTime: new Date(Date.now() - 3600000),
          unreadCount: 0,
        },
      ];
      setChatMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadConnectionRequests = async () => {
    try {
      // Mock data for now - replace with actual Firebase implementation
      const mockRequests: ConnectionRequest[] = [
        {
          id: '1',
          userId: 'user3',
          firstName: 'Carol',
          lastName: 'Davis',
          email: 'carol@example.com',
          photoURL: '',
          bio: 'Love hiking and photography',
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: '2',
          userId: 'user4',
          firstName: 'David',
          lastName: 'Wilson',
          email: 'david@example.com',
          photoURL: '',
          bio: 'Software developer',
          status: 'pending',
          createdAt: new Date(Date.now() - 86400000),
        },
      ];
      setConnectionRequests(mockRequests);
    } catch (error) {
      console.error('Error loading connection requests:', error);
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
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: currentTheme.border }]}>
              <Ionicons name="person" size={24} color={currentTheme.textSecondary} />
            </View>
          )}
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
        style={styles.connectIconButton}
        onPress={() => handleConnectUser(item)}
      >
        <Ionicons name="person-add-outline" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderMessageItem = ({ item }: { item: ChatMessage }) => (
    <TouchableOpacity
      style={[styles.messageItem, { backgroundColor: currentTheme.surface }]}
      onPress={() => {
        // Navigate to chat
        Alert.alert('Open Chat', `Open conversation with ${item.participantName}`);
      }}
    >
      <View style={styles.messageInfo}>
        <View style={styles.avatarContainer}>
          {item.participantPhotoURL ? (
            <Image source={{ uri: item.participantPhotoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: currentTheme.border }]}>
              <Ionicons name="person" size={24} color={currentTheme.textSecondary} />
            </View>
          )}
        </View>
        <View style={styles.messageDetails}>
          <Text style={[styles.participantName, { color: currentTheme.text }]}>
            {item.participantName}
          </Text>
          <Text style={[styles.lastMessage, { color: currentTheme.textSecondary }]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
      </View>
      <View style={styles.messageTime}>
        <Text style={[styles.timeText, { color: currentTheme.textSecondary }]}>
          {formatTimeAgo(item.lastMessageTime)}
        </Text>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderConnectionItem = ({ item }: { item: ConnectionRequest }) => (
    <TouchableOpacity
      style={[styles.connectionItem, { backgroundColor: currentTheme.surface }]}
      onPress={() => handleUserPress(item)}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: currentTheme.border }]}>
              <Ionicons name="person" size={24} color={currentTheme.textSecondary} />
            </View>
          )}
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
      <View style={styles.connectionActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => {
            Alert.alert('Accept', `Accept connection request from ${item.firstName}?`);
          }}
        >
          <Ionicons name="checkmark" size={18} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => {
            Alert.alert('Reject', `Reject connection request from ${item.firstName}?`);
          }}
        >
          <Ionicons name="close" size={18} color="white" />
        </TouchableOpacity>
      </View>
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
      ) : (
        <View style={[styles.postMediaPlaceholder, { backgroundColor: currentTheme.surface }]}>
          <Ionicons name="image-outline" size={60} color={currentTheme.textSecondary} />
          <Text style={[styles.placeholderText, { color: currentTheme.textSecondary }]}>No Image</Text>
        </View>
      )}

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

  const renderEmptyState = () => {
    const getEmptyStateConfig = () => {
      switch (activeTab) {
        case 'people':
          return {
            icon: 'people-outline',
            title: 'No People Found',
            subtitle: 'There are no people to show right now.'
          };
        case 'posts':
          return {
            icon: 'document-text-outline',
            title: 'No Posts Found',
            subtitle: 'There are no posts to show right now.'
          };
        case 'messages':
          return {
            icon: 'chatbubble-outline',
            title: 'No Messages',
            subtitle: 'Start a conversation with someone nearby.'
          };
        case 'connections':
          return {
            icon: 'person-add-outline',
            title: 'No Requests',
            subtitle: 'You have no pending connection requests.'
          };
        default:
          return {
            icon: 'people-outline',
            title: 'No Data',
            subtitle: 'Nothing to show right now.'
          };
      }
    };

    const config = getEmptyStateConfig();

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={config.icon as any}
          size={64}
          color={currentTheme.textSecondary}
        />
        <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
          {config.title}
        </Text>
        <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
          {config.subtitle}
        </Text>
      </View>
    );
  };

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
        <TouchableOpacity
          style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
          onPress={() => setActiveTab('messages')}
        >
          <Text style={[
            styles.tabText, 
            { color: currentTheme.textSecondary }, 
            activeTab === 'messages' && styles.activeTabText
          ]}>
            Messages
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'connections' && styles.activeTab]}
          onPress={() => setActiveTab('connections')}
        >
          <Text style={[
            styles.tabText, 
            { color: currentTheme.textSecondary }, 
            activeTab === 'connections' && styles.activeTabText
          ]}>
            Requests
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={
            activeTab === 'people' ? nearbyUsers :
            activeTab === 'posts' ? nearbyPosts :
            activeTab === 'messages' ? chatMessages :
            connectionRequests
          }
          keyExtractor={(item) => item.id}
          renderItem={
            activeTab === 'people' ? renderUserItem :
            activeTab === 'posts' ? renderPostItem :
            activeTab === 'messages' ? renderMessageItem :
            renderConnectionItem
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            (activeTab === 'people' ? nearbyUsers : 
             activeTab === 'posts' ? nearbyPosts :
             activeTab === 'messages' ? chatMessages :
             connectionRequests).length === 0
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
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
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
    marginTop: SPACING.sm,
    borderRadius: 8,
  },
  postMediaPlaceholder: {
    width: '100%',
    height: 200,
    marginTop: SPACING.sm,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: SPACING.xs,
    fontSize: 14,
    fontFamily: FONTS.regular,
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
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  messageTime: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  unreadText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: 'white',
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
  },
  connectionActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
});