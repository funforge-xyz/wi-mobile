
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';
import SkeletonLoader from '../components/SkeletonLoader';
import BlockUserConfirmationModal from '../components/BlockUserConfirmationModal';
import { useTranslation } from 'react-i18next';

interface UserProfileProps {
  route: {
    params: {
      userId: string;
      firstName?: string;
      lastName?: string;
      photoURL?: string;
      bio?: string;
    };
  };
  navigation: any;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio: string;
  postsCount: number;
  connectionsCount: number;
}

export default function UserProfileScreen({ route, navigation }: UserProfileProps) {
  const { userId, firstName = '', lastName = '', photoURL = '', bio = '' } = route.params;
  const [profile, setProfile] = useState<UserProfile>({
    id: userId,
    firstName,
    lastName,
    email: '',
    photoURL,
    bio,
    postsCount: 0,
    connectionsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        setProfile({
          id: userId,
          firstName: userData.firstName || firstName,
          lastName: userData.lastName || lastName,
          email: userData.email || '',
          photoURL: userData.photoURL || photoURL,
          bio: userData.bio || bio,
          postsCount: 0,
          connectionsCount: 0,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert(t('common.error'), t('userProfile.failedToLoadProfile'));
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = () => {
    setShowBlockModal(true);
  };

  const handleConfirmBlock = async () => {
    try {
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const firestore = getFirestore();

      // Add to blocked users
      await addDoc(collection(firestore, 'blockedUsers'), {
        blockerUserId: currentUser.uid,
        blockedUserId: userId,
        createdAt: new Date(),
      });

      // Remove from connections
      const connectionsQuery = query(
        collection(firestore, 'connections'),
        where('participants', 'array-contains', currentUser.uid)
      );
      const connectionsSnapshot = await getDocs(connectionsQuery);
      
      for (const connectionDoc of connectionsSnapshot.docs) {
        const data = connectionDoc.data();
        if (data.participants.includes(userId)) {
          await connectionDoc.ref.delete();
        }
      }

      Alert.alert(t('common.done'), t('userProfile.userBlocked'));
      navigation.goBack();
    } catch (error) {
      console.error('Error blocking user:', error);
      Alert.alert(t('common.error'), t('userProfile.failedToBlock'));
    }
    setShowBlockModal(false);
  };

  const handleCancelBlock = () => {
    setShowBlockModal(false);
  };

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{t('userProfile.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileHeader, { backgroundColor: currentTheme.surface }]}>
          {profile.photoURL ? (
            <ProfileImage 
              uri={profile.photoURL} 
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
              : t('userProfile.anonymousUser')}
          </Text>
          
          {profile.bio ? (
            <Text style={[styles.bio, { color: currentTheme.textSecondary }]}>
              {profile.bio}
            </Text>
          ) : null}
        </View>

        <View style={[styles.menuSection, { backgroundColor: currentTheme.surface }]}>
          <TouchableOpacity style={styles.menuItem} onPress={handleBlockUser}>
            <Ionicons name="ban-outline" size={20} color={COLORS.error} />
            <Text style={[styles.menuText, { color: COLORS.error }]}>{t('userProfile.blockUser')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BlockUserConfirmationModal
        visible={showBlockModal}
        onConfirm={handleConfirmBlock}
        onCancel={handleCancelBlock}
        currentTheme={currentTheme}
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

const ProfileImage = ({ uri, style, ...props }: { uri: string; style: any; [key: string]: any }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [uri]);

  return (
    <View style={style}>
      {loading && !error && (
        <SkeletonLoader
          width={style?.width || 120}
          height={style?.height || 120}
          borderRadius={style?.borderRadius || 60}
          style={{ position: 'absolute' }}
        />
      )}
      <Image
        source={{ uri }}
        style={[style, { opacity: 1 }]}
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
  bio: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
    maxWidth: '90%',
    flexWrap: 'wrap',
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
