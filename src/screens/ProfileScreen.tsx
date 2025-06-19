import { useState, useEffect } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/ProfileStyles';
import { getTheme } from '../theme';
import { handleSignOut, onRefresh, loadProfile } from '../utils/profileUtils';
import ProfileHeader from '../components/ProfileHeader';
import ProfileInfo from '../components/ProfileInfo';
import ProfileMenu from '../components/ProfileMenu';
import ProfileSkeleton from '../components/ProfileSkeleton';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { profile, loading } = useAppSelector((state) => state.user);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  const currentTheme = getTheme(isDarkMode);

  useEffect(() => {
    if (!profile || (profile && Date.now() - profile.lastUpdated > 300000)) {
      loadProfile(dispatch, profile);
    }
  }, [dispatch, profile]);

  const handleRefresh = () => {
    onRefresh(setRefreshing, dispatch, t);
  };

  const handleSignOutPress = () => {
    handleSignOut(navigation, t);
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ProfileHeader
        title={t('profile.title')}
        onBackPress={() => navigation.goBack()}
        currentTheme={currentTheme}
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <ProfileInfo 
          profile={profile}
          currentTheme={currentTheme}
          t={t}
        />

        <ProfileMenu
          currentTheme={currentTheme}
          navigation={navigation}
          onSignOut={handleSignOutPress}
          t={t}
        />
      </ScrollView>
    </SafeAreaView>
  );
}