import { useState, useEffect } from 'react';
import { ScrollView, ActivityIndicator, View } from 'react-native';
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
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();
  const currentTheme = getTheme(isDarkMode);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const profileData = await loadUserProfileData(
        userId, 
        { firstName, lastName, photoURL, bio },
        t
      );

      if (profileData) {
        setProfile(profileData);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = () => {
    setShowBlockModal(true);
  };

  const handleConfirmBlock = async () => {
    await handleBlockUserAction(
      profile.id,
      t,
      () => {
        setShowBlockModal(false);
        setShowSuccessModal(true);
      }
    );
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Navigate to NearbyScreen (People tab)
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
          onBlockUser={handleBlockUser}
          currentTheme={currentTheme}
          styles={styles}
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