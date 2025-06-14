import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { authService } from '../services/auth';
import { useAppSelector } from '../hooks/redux';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import { useNavigation, CommonActions } from '@react-navigation/native';
import SkeletonLoader from '../components/SkeletonLoader';
import ProfileSkeleton from '../components/ProfileSkeleton';
import { useTranslation } from 'react-i18next';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  thumbnailURL: string;
  bio: string;
  postsCount: number;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    firstName: '',
    lastName: '',
    email: 'loading@example.com',
    photoURL: 'https://via.placeholder.com/120',
    thumbnailURL: '',
    bio: '',
    postsCount: 0,
  });
  const [connectionsCount, setConnectionsCount] = useState(0);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { t } = useTranslation();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      // Wait for Firebase to be initialized
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();

      // Get current user from Firebase Auth
      const currentUser = auth.currentUser || await authService.getCurrentUser();

      if (currentUser) {
        // Try to get profile data from Firestore
        const firestore = getFirestore();
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        let userData: UserProfile;

        // Get user's post count
        const postsCollection = collection(firestore, 'posts');
        const userPostsQuery = query(postsCollection, where('authorId', '==', currentUser.uid));
        const userPostsSnapshot = await getDocs(userPostsQuery);
        const postsCount = userPostsSnapshot.size;

        // Get user's connections count
        const connectionsQuery = query(
          collection(firestore, 'connections'),
          where('participants', 'array-contains', currentUser.uid),
          where('status', '==', 'active')
        );
        const connectionsSnapshot = await getDocs(connectionsQuery);
        setConnectionsCount(connectionsSnapshot.size);

        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          userData = {
            id: currentUser.uid,
            firstName: firestoreData.firstName || '',
            lastName: firestoreData.lastName || '',
            email: currentUser.email || '',
            photoURL: firestoreData.photoURL || '',
            thumbnailURL: firestoreData.thumbnailURL || '',
            bio: firestoreData.bio || '',
            postsCount: postsCount,
          };
        } else {
          // Create default profile data if no Firestore document exists
          userData = {
            id: currentUser.uid,
            firstName: '',
            lastName: '',
            email: currentUser.email || '',
            photoURL: '',
            thumbnailURL: '',
            bio: '',
            postsCount: postsCount,
          };
        }

        setProfile(userData);
      } else {
        Alert.alert(t('common.error'), 'No user found');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert(t('common.error'), t('profile.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };



  const handleSignOut = async () => {
    Alert.alert(
      t('profile.signOut'),
      t('profile.signOutConfirmation'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.signOut'),
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.signOut();
              // Reset navigation stack to Login screen
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Root' }],
                })
              );
            } catch (error) {
              Alert.alert(t('common.error'), 'Failed to sign out');
            }
          },
        },
      ]
    );
  };



  const handleDeleteProfile = async () => {
    Alert.alert(
      t('profile.deleteProfile'),
      t('profile.deleteProfileConfirmation'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await authService.deleteProfile();
              // Reset navigation stack to Login screen
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Root' }],
                })
              );
            } catch (error: any) {
              console.error('Delete profile error:', error);
              setLoading(false);

              // Handle specific re-authentication error
              if (error.message && error.message.includes('sign out and sign back in')) {
                Alert.alert(
                  t('profile.reAuthenticationRequired'),
                  t('profile.reAuthenticationMessage'),
                  [
                    {
                      text: t('common.ok'),
                      onPress: () => handleSignOut(),
                    },
                  ]
                );
              } else {
                Alert.alert(t('common.error'), t('profile.failedToDelete'));
              }
            }
          },
        },
      ]
    );
  };



  const currentTheme = isDarkMode ? darkTheme : lightTheme;




  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{t('profile.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[styles.profileHeader, { backgroundColor: currentTheme.surface }]}>
          {(profile.thumbnailURL || profile.photoURL) && (profile.thumbnailURL || profile.photoURL).trim() !== '' ? (
            <ProfileImage
              uri={profile.thumbnailURL || profile.photoURL}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar, { backgroundColor: currentTheme.surface }]}>
              <Ionicons name="person-add" size={40} color={currentTheme.textSecondary} />
            </View>
          )}

          <Text style={[styles.displayName, { color: currentTheme.text }]}>
            {profile.firstName && profile.lastName
              ? `${profile.firstName} ${profile.lastName}`
              : t('profile.anonymousUser')}
          </Text>

          <Text style={[styles.bio, { color: currentTheme.textSecondary }]}>
            {profile.bio}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: currentTheme.text }]}>
                {profile.postsCount}
              </Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                {t('profile.posts')}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: currentTheme.text }]}>
                {connectionsCount}
              </Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                {t('profile.connections')}
              </Text>
            </View>
          </View>


        </View>

        <View style={[styles.menuSection, { backgroundColor: currentTheme.surface }]}>
          <TouchableOpacity style={styles.menuItem} onPress={() => (navigation as any).navigate('Settings')}>
            <Ionicons name="settings-outline" size={20} color={currentTheme.text} />
            <Text style={[styles.menuText, { color: currentTheme.text }]}>{t('profile.settings')}</Text>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>



          <TouchableOpacity style={styles.menuItem} onPress={() => (navigation as any).navigate('HelpSupport')}>
            <Ionicons name="help-circle-outline" size={20} color={currentTheme.text} />
            <Text style={[styles.menuText, { color: currentTheme.text }]}>{t('profile.helpSupport')}</Text>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={[styles.menuText, { color: COLORS.error }]}>{t('profile.signOut')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleDeleteProfile}>
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            <Text style={[styles.menuText, { color: COLORS.error }]}>{t('profile.deleteProfile')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>


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

const ProfileImage = ({ uri, style, ...props }: { uri: string; style: any; [key: string]: any }) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  // Get proper width value for shimmer effect
  const imageWidth = typeof style?.width === 'number' ? style.width : 120;
  const imageHeight = typeof style?.height === 'number' ? style.height : 120;

  React.useEffect(() => {
    setLoading(true);
    setError(false);
  }, [uri]);

  return (
    <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
      {loading && !error && (
        <SkeletonLoader
          width={imageWidth}
          height={imageHeight}
          borderRadius={style?.borderRadius || 60}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        />
      )}
      <Image
        source={{ uri, cache: 'reload' }}
        style={[style, { opacity: loading ? 0 : 1 }]}
        onLoadStart={() => {
          setLoading(true);
          setError(false);
        }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    fontFamily: FONTS.regular,
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
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: SPACING.lg,
    margin: SPACING.md,
    borderRadius: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: SPACING.md,
    resizeMode: 'cover',
  },
  placeholderAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.sm,
  },
  bio: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: SPACING.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  editButtonText: {
    color: 'white',
    fontFamily: FONTS.medium,
    marginLeft: SPACING.xs,
  },
  menuSection: {
    margin: SPACING.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.md,
  },

});