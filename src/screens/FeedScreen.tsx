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
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { Post } from '../types/models';
import { Settings } from '../services/storage';
import { useAppSelector } from '../hooks/redux';

const { width } = Dimensions.get('window');

interface PostItemProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  currentTheme: any;
}

const PostItem: React.FC<PostItemProps> = ({ post, onLike, onComment, onShare, currentTheme }) => {
  return (
    <View style={[styles.postContainer, { backgroundColor: currentTheme.surface }]}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <View>
            <Text style={[styles.username, { color: currentTheme.text }]}>User {post.userId.slice(0, 8)}</Text>
            <Text style={[styles.timestamp, { color: currentTheme.textSecondary }]}>
              {new Date(post.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={currentTheme.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.postContent, { color: currentTheme.text }]}>{post.content}</Text>

      {post.attachments && post.attachments.length > 0 && (
        <View style={styles.mediaContainer}>
          {post.attachments.map((attachment, index) => (
            <Image
              key={index}
              source={{ uri: attachment.url }}
              style={styles.postImage}
              resizeMode="cover"
            />
          ))}
        </View>
      )}

      <View style={[styles.postActions, { borderTopColor: currentTheme.border }]}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike(post.id)}
        >
          <Ionicons name="heart-outline" size={24} color={currentTheme.textSecondary} />
          <Text style={[styles.actionText, { color: currentTheme.textSecondary }]}>{post.likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment(post.id)}
        >
          <Ionicons name="chatbubble-outline" size={24} color={currentTheme.textSecondary} />
          <Text style={[styles.actionText, { color: currentTheme.textSecondary }]}>{post.commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onShare(post.id)}
        >
          <Ionicons name="share-outline" size={24} color={currentTheme.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const settings = new Settings();

  // Mock data - replace with actual API calls
  const mockPosts: Post[] = [
    {
      id: '1',
      userId: 'user1',
      content: 'Just had an amazing coffee at the local cafe! ☕ The atmosphere here is perfect for working.',
      attachments: [
        {
          id: 'att1',
          url: 'https://via.placeholder.com/400x300',
          type: 'image',
          size: 12345,
          name: 'coffee.jpg',
        },
      ],
      location: { latitude: 37.7749, longitude: -122.4194 },
      likesCount: 12,
      commentsCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      userId: 'user2',
      content: 'Beautiful sunset today! Nature never ceases to amaze me. 🌅',
      attachments: [
        {
          id: 'att2',
          url: 'https://via.placeholder.com/400x600',
          type: 'image',
          size: 23456,
          name: 'sunset.jpg',
        },
      ],
      location: { latitude: 37.7849, longitude: -122.4094 },
      likesCount: 28,
      commentsCount: 7,
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(Date.now() - 3600000),
    },
    {
      id: '3',
      userId: 'user3',
      content: 'Just finished reading an incredible book! Can\'t wait to discuss it with someone. Anyone else read "The Design of Everyday Things"?',
      attachments: [],
      location: { latitude: 37.7649, longitude: -122.4294 },
      likesCount: 5,
      commentsCount: 1,
      createdAt: new Date(Date.now() - 7200000),
      updatedAt: new Date(Date.now() - 7200000),
    },
  ];

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPosts(mockPosts);
    } catch (error) {
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLike = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, likesCount: post.likesCount + 1 }
          : post
      )
    );
  };

  const handleComment = (postId: string) => {
    Alert.alert('Comments', 'Comments functionality coming soon!');
  };

  const handleShare = (postId: string) => {
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const renderEmptyState = () => {
    const currentTheme = isDarkMode ? darkTheme : lightTheme;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="newspaper-outline" size={64} color={currentTheme.textSecondary} />
        <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>No Posts Yet</Text>
        <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
          Be the first to share something with your community!
        </Text>
      </View>
    );
  };

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Home</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color={currentTheme.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostItem
            post={item}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            currentTheme={currentTheme}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : undefined}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  postContainer: {
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },
  username: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  postContent: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  mediaContainer: {
    marginBottom: SPACING.sm,
  },
  postImage: {
    width: width,
    height: 300,
  },
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  actionText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.xs,
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
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 24,
  },
});