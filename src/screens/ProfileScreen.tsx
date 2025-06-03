
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/auth';
import { COLORS, FONTS, SPACING } from '../config/constants';

interface ProfileStats {
  posts: number;
  followers: number;
  following: number;
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState<ProfileStats>({ posts: 0, followers: 0, following: 0 });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const mockUser = {
    displayName: 'John Doe',
    email: 'john.doe@example.com',
    photoURL: 'https://via.placeholder.com/100',
    bio: 'Coffee enthusiast ☕ | Tech lover 💻 | Always exploring new places 🌍',
  };

  const mockStats = {
    posts: 24,
    followers: 186,
    following: 143,
  };

  useEffect(() => {
    setStats(mockStats);
  }, []);

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Edit profile functionality coming soon!');
  };

  const handleSettings = () => {
    navigation.navigate('Settings' as never);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.signOut();
              navigation.navigate('Login' as never);
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleMyPosts = () => {
    Alert.alert('My Posts', 'View your posts functionality coming soon!');
  };

  const handleFollowers = () => {
    Alert.alert('Followers', 'View followers functionality coming soon!');
  };

  const handleFollowing = () => {
    Alert.alert('Following', 'View following functionality coming soon!');
  };

  const renderStatItem = (label: string, value: number, onPress: () => void) => (
    <TouchableOpacity style={styles.statItem} onPress={onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode,
    showArrow: boolean = true
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color={COLORS.primary} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showArrow && onPress && (
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleSettings}>
              <Ionicons name="settings-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileSection}>
          <Image
            source={{ uri: mockUser.photoURL }}
            style={styles.profileImage}
          />
          <Text style={styles.displayName}>{mockUser.displayName}</Text>
          <Text style={styles.email}>{mockUser.email}</Text>
          {mockUser.bio && (
            <Text style={styles.bio}>{mockUser.bio}</Text>
          )}

          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          {renderStatItem('Posts', stats.posts, handleMyPosts)}
          {renderStatItem('Followers', stats.followers, handleFollowers)}
          {renderStatItem('Following', stats.following, handleFollowing)}
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          {renderSettingItem(
            'notifications-outline',
            'Notifications',
            'Receive push notifications',
            undefined,
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />,
            false
          )}

          {renderSettingItem(
            'location-outline',
            'Location Sharing',
            'Share your location with others',
            undefined,
            <Switch
              value={locationSharingEnabled}
              onValueChange={setLocationSharingEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />,
            false
          )}

          {renderSettingItem(
            'moon-outline',
            'Dark Mode',
            'Use dark theme',
            undefined,
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />,
            false
          )}
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          {renderSettingItem(
            'key-outline',
            'Change Password',
            undefined,
            () => navigation.navigate('ChangePassword' as never)
          )}

          {renderSettingItem(
            'shield-outline',
            'Privacy Policy',
            undefined,
            () => Alert.alert('Privacy Policy', 'Privacy policy functionality coming soon!')
          )}

          {renderSettingItem(
            'help-circle-outline',
            'Help & Support',
            undefined,
            () => Alert.alert('Help & Support', 'Help & support functionality coming soon!')
          )}

          {renderSettingItem(
            'information-circle-outline',
            'About',
            undefined,
            () => Alert.alert('About', 'Wi Chat v1.0.0')
          )}

          {renderSettingItem(
            'trash-outline',
            'Delete Account',
            'Permanently delete your account',
            () => navigation.navigate('DeleteAccount' as never)
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Wi Chat v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: SPACING.md,
  },
  displayName: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  bio: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  editButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  settingsSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  footerText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
});
