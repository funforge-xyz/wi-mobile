
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { toggleTheme } from '../store/themeSlice';
import { Settings } from '../services/storage';
import { initializeNotifications } from '../services/notifications';
import * as Notifications from 'expo-notifications';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const settings = new Settings();

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load push notification settings
      const { status } = await Notifications.getPermissionsAsync();
      setPushNotificationsEnabled(status === 'granted');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleToggleTheme = async () => {
    const newValue = !isDarkMode;
    dispatch(toggleTheme());
    await settings.setDarkMode(newValue);
  };

  const handleTogglePushNotifications = async (value: boolean) => {
    setIsLoading(true);
    
    try {
      if (value) {
        // Request permission and initialize notifications
        const token = await initializeNotifications();
        if (token) {
          setPushNotificationsEnabled(true);
          Alert.alert('Success', 'Push notifications enabled successfully');
        } else {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive updates',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Open Settings',
                onPress: () => Notifications.openSettingsAsync(),
              },
            ]
          );
        }
      } else {
        // For disabling, we can't revoke permissions but we can stop handling them
        setPushNotificationsEnabled(false);
        Alert.alert('Disabled', 'Push notifications have been disabled');
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Appearance</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons 
                name={isDarkMode ? 'moon' : 'sunny'} 
                size={20} 
                color={currentTheme.text} 
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.settingDescription, { color: currentTheme.textSecondary }]}>
                  {isDarkMode ? 'Dark theme enabled' : 'Light theme enabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleTheme}
              trackColor={{ false: currentTheme.border, true: COLORS.primary }}
              thumbColor={isDarkMode ? 'white' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons 
                name="notifications" 
                size={20} 
                color={currentTheme.text} 
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                  Push Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: currentTheme.textSecondary }]}>
                  Receive notifications for messages, likes, and comments
                </Text>
              </View>
            </View>
            <Switch
              value={pushNotificationsEnabled}
              onValueChange={handleTogglePushNotifications}
              disabled={isLoading}
              trackColor={{ false: currentTheme.border, true: COLORS.primary }}
              thumbColor={pushNotificationsEnabled ? 'white' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Account</Text>
          
          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => (navigation as any).navigate('ChangePassword')}
          >
            <View style={styles.settingInfo}>
              <Ionicons 
                name="key-outline" 
                size={20} 
                color={currentTheme.text} 
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                  Change Password
                </Text>
                <Text style={[styles.settingDescription, { color: currentTheme.textSecondary }]}>
                  Update your account password
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => (navigation as any).navigate('DeleteAccount')}
          >
            <View style={styles.settingInfo}>
              <Ionicons 
                name="trash-outline" 
                size={20} 
                color={COLORS.error} 
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: COLORS.error }]}>
                  Delete Account
                </Text>
                <Text style={[styles.settingDescription, { color: currentTheme.textSecondary }]}>
                  Permanently delete your account and data
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Support</Text>
          
          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => (navigation as any).navigate('HelpSupport')}
          >
            <View style={styles.settingInfo}>
              <Ionicons 
                name="help-circle-outline" 
                size={20} 
                color={currentTheme.text} 
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                  Help & Support
                </Text>
                <Text style={[styles.settingDescription, { color: currentTheme.textSecondary }]}>
                  Get help and view frequently asked questions
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => (navigation as any).navigate('PrivacyPolicy')}
          >
            <View style={styles.settingInfo}>
              <Ionicons 
                name="shield-outline" 
                size={20} 
                color={currentTheme.text} 
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                  Privacy Policy
                </Text>
                <Text style={[styles.settingDescription, { color: currentTheme.textSecondary }]}>
                  View our privacy policy and terms
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
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
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  content: {
    flex: 1,
    paddingTop: SPACING.md,
  },
  section: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 12,
    paddingVertical: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: SPACING.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
});
