
import { Alert } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio: string;
  postsCount: number;
  connectionsCount: number;
}

export const loadUserProfileData = async (
  userId: string,
  initialData: { firstName?: string; lastName?: string; photoURL?: string; bio?: string },
  t: (key: string) => string
): Promise<UserProfile | null> => {
  try {
    const firestore = getFirestore();
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();

      return {
        id: userId,
        firstName: userData.firstName || initialData.firstName || '',
        lastName: userData.lastName || initialData.lastName || '',
        email: userData.email || '',
        photoURL: userData.photoURL || initialData.photoURL || '',
        bio: userData.bio || initialData.bio || '',
        postsCount: 0,
        connectionsCount: 0,
      };
    }
    return null;
  } catch (error) {
    console.error('Error loading user profile:', error);
    Alert.alert(t('common.error'), t('userProfile.failedToLoadProfile'));
    return null;
  }
};

export const handleBlockUserAction = async (
  profileId: string,
  t: (key: string) => string,
  onSuccess: () => void
) => {
  try {
    const { blockUser } = await import('./chatsUtils');
    await blockUser(profileId);

    Alert.alert(t('common.done'), t('userProfile.userBlocked'));
    onSuccess();
  } catch (error) {
    console.error('Error blocking user:', error);
    Alert.alert('Error', t('userProfile.failedToBlock'));
  }
};

export const getTheme = (isDarkMode: boolean) => {
  return isDarkMode ? {
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
  } : {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#000000',
    textSecondary: '#6C757D',
    border: '#E9ECEF',
  };
};
