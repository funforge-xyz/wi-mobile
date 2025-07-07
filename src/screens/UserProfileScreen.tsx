import { useState, useEffect } from 'react';
import { ScrollView, ActivityIndicator, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import BlockUserConfirmationModal from '../components/BlockUserConfirmationModal';
import BlockUserSuccessModal from '../components/BlockUserSuccessModal';
import UserProfileHeader from '../components/UserProfileHeader';
import UserProfileDisplay from '../components/UserProfileDisplay';
import UserProfileActions from '../components/UserProfileActions';
import ProfileSkeleton from '../components/ProfileSkeleton';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/UserProfileStyles';
import { getTheme } from '../theme';
import { 
  loadUserProfileData, 
  handleBlockUserAction, 
  checkIfUserIsBlocked,
  UserProfile
} from '../utils/userProfileUtils';



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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();
  const currentTheme = getTheme(isDarkMode);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Check if user is blocked first
      const blocked = await checkIfUserIsBlocked(userId);
      setIsUserBlocked(blocked);
      
      if (!blocked) {
        const profileData = await loadUserProfileData(
          userId, 
          { firstName, lastName, photoURL, bio },
          t
        );

        if (profileData) {
          setProfile(profileData);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = () => {
    setShowBlockModal(true);
  };

  const handleConfirmBlock = async () => {
    try {
      await handleBlockUserAction(
        profile.id,
        t,
        () => {
          setShowBlockModal(false);
          setShowSuccessModal(true);
        }
      );
    } catch (error) {
      console.error('Error blocking user:', error);
      setShowBlockModal(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Navigate to NearbyScreen (People tab)
    navigation.navigate('Root', { 
      screen: 'People'
    });
  };

  const handleCancelBlock = () => {
    setShowBlockModal(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  if (isUserBlocked) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <UserProfileHeader
          onBackPress={() => navigation.goBack()}
          currentTheme={currentTheme}
          styles={styles}
        />
        
        <View style={[styles.content, { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <Text style={[styles.blockedTitle, { color: currentTheme.text, fontSize: 24, fontWeight: 'bold', marginBottom: 10 }]}>
            {t('userProfile.userIsBlocked')}
          </Text>
          <Text style={[styles.blockedMessage, { color: currentTheme.textSecondary, textAlign: 'center', lineHeight: 20 }]}>
            {t('userProfile.cannotViewBlockedProfile')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <UserProfileHeader
        onBackPress={() => navigation.goBack()}
        currentTheme={currentTheme}
        styles={styles}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <UserProfileDisplay
          profile={profile}
          currentTheme={currentTheme}
          styles={styles}
        />

        <UserProfileActions
          onConnect={() => {}}
          onMessage={() => {}}
          onBlock={handleBlockUser}
          onDeleteConnection={() => navigation.navigate('UserPosts', { 
            userId: route.params.userId,
            firstName: route.params.firstName,
            lastName: route.params.lastName
          })}
          currentTheme={currentTheme}
          isConnected={false}
          hasConnectionRequest={false}
          isBlocked={false}
          styles={styles}
          userName={`${profile.firstName} ${profile.lastName}`}
          navigation={navigation}
        />
      </ScrollView>

      <BlockUserConfirmationModal
        visible={showBlockModal}
        onConfirm={handleConfirmBlock}
        onCancel={handleCancelBlock}
        currentTheme={currentTheme}
      />

      <BlockUserSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        currentTheme={currentTheme}
      />
    </SafeAreaView>
  );
}