
import { useState, useEffect } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { useDataRefresh } from '../hooks/useDataRefresh';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/ProfileStyles';
import { getTheme } from '../theme';
import { handleSignOut, onRefresh, loadProfile } from '../utils/profileUtils';
import { COLORS } from '../config/constants';
import ProfileHeader from '../components/ProfileHeader';
import ProfileInfo from '../components/ProfileInfo';
import SettingsSection from '../components/SettingsSection';
import SettingsActionRow from '../components/SettingsActionRow';
import ProfileSkeleton from '../components/ProfileSkeleton';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { profile, loading, lastProfileFetch } = useAppSelector((state) => state.user);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  const currentTheme = getTheme(isDarkMode);

  // Use data refresh hook to automatically refresh when screen is focused
  useDataRefresh({
    fetchData: () => loadProfile(dispatch, profile),
    lastFetch: lastProfileFetch,
    refreshThreshold: 5 * 60 * 1000 // 5 minutes
  });

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

        <SettingsSection title={t('profile.account')} currentTheme={currentTheme}>
          <SettingsActionRow
            icon="settings-outline"
            title={t('profile.settings')}
            description={t('profile.manageSettings')}
            onPress={() => navigation.navigate('Settings')}
            currentTheme={currentTheme}
          />

          <SettingsActionRow
            icon="help-circle-outline"
            title={t('profile.helpSupport')}
            description={t('profile.getHelp')}
            onPress={() => navigation.navigate('HelpSupport')}
            currentTheme={currentTheme}
          />
        </SettingsSection>

        <SettingsSection title={t('profile.session')} currentTheme={currentTheme}>
          <SettingsActionRow
            icon="log-out-outline"
            title={t('profile.signOut')}
            description={t('profile.signOutDescription')}
            onPress={handleSignOutPress}
            iconColor={COLORS.error}
            titleColor={COLORS.error}
            currentTheme={currentTheme}
          />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}
