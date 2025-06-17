
import { Alert } from 'react-native';
import { authService } from '../services/auth';
import { CommonActions } from '@react-navigation/native';

export const handleSignOut = async (navigation: any, t: (key: string) => string) => {
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
};

export const onRefresh = async (
  setRefreshing: (value: boolean) => void,
  dispatch: any,
  t: (key: string) => string
) => {
  setRefreshing(true);
  try {
    const { getAuth } = await import('../services/firebase');
    const auth = getAuth();
    const currentUser = auth.currentUser || await authService.getCurrentUser();

    if (currentUser) {
      const { fetchUserProfile } = await import('../store/userSlice');
      await dispatch(fetchUserProfile(currentUser.uid));
    } else {
      Alert.alert(t('common.error'), 'No user found');
    }
  } catch (error) {
    console.error('Error refreshing profile:', error);
    Alert.alert(t('common.error'), t('profile.failedToLoad'));
  } finally {
    setRefreshing(false);
  }
};

export const loadProfile = async (dispatch: any, profile: any) => {
  try {
    const { getAuth } = await import('../services/firebase');
    const auth = getAuth();
    const currentUser = auth.currentUser || await authService.getCurrentUser();

    if (currentUser) {
      const { fetchUserProfile } = await import('../store/userSlice');
      dispatch(fetchUserProfile(currentUser.uid));
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
};
