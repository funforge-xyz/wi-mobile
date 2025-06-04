
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { Settings } from '../services/settings';
import * as ImagePicker from 'expo-image-picker';

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
  bio: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    displayName: 'John Doe',
    email: 'john@example.com',
    photoURL: 'https://via.placeholder.com/120',
    bio: 'Mobile developer passionate about creating amazing apps',
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const settings = new Settings();

  useEffect(() => {
    loadSettings();
    loadUserProfile();
  }, []);

  const loadSettings = async () => {
    const darkMode = await settings.getDarkMode();
    setIsDarkMode(darkMode);
  };

  const loadUserProfile = async () => {
    // In a real app, this would fetch from your backend/Firebase
    // For now, we'll simulate loading user data
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // This would be replaced with actual user data from your auth service
      const userData = {
        id: '1',
        displayName: 'John Doe',
        email: 'john@example.com',
        photoURL: 'https://via.placeholder.com/120',
        bio: 'Mobile developer passionate about creating amazing apps',
        postsCount: 12,
        followersCount: 156,
        followingCount: 89,
      };
      
      setProfile(userData);
      setEditedProfile(userData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    await settings.setDarkMode(newValue);
    Alert.alert('Dark Mode', `Dark mode ${newValue ? 'enabled' : 'disabled'}`);
  };

  const handleEditProfile = () => {
    setEditedProfile(profile);
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      // In a real app, this would update the backend/Firebase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfile(editedProfile);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setEditedProfile({
        ...editedProfile,
        photoURL: result.assets[0].uri,
      });
    }
  };

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  if (loading && !isEditing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: currentTheme.text }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Profile</Text>
        <TouchableOpacity onPress={toggleDarkMode}>
          <Ionicons 
            name={isDarkMode ? 'sunny' : 'moon'} 
            size={24} 
            color={currentTheme.text} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileHeader, { backgroundColor: currentTheme.surface }]}>
          <TouchableOpacity onPress={isEditing ? handleImagePicker : undefined}>
            <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
            {isEditing && (
              <View style={styles.editImageOverlay}>
                <Ionicons name="camera" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
          
          <Text style={[styles.displayName, { color: currentTheme.text }]}>
            {profile.displayName}
          </Text>
          <Text style={[styles.email, { color: currentTheme.textSecondary }]}>
            {profile.email}
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
                Posts
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: currentTheme.text }]}>
                {profile.followersCount}
              </Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                Followers
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: currentTheme.text }]}>
                {profile.followingCount}
              </Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                Following
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={16} color="white" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.menuSection, { backgroundColor: currentTheme.surface }]}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={20} color={currentTheme.text} />
            <Text style={[styles.menuText, { color: currentTheme.text }]}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={20} color={currentTheme.text} />
            <Text style={[styles.menuText, { color: currentTheme.text }]}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={[styles.menuText, { color: COLORS.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditing} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
            <TouchableOpacity onPress={handleCancelEdit}>
              <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <TouchableOpacity onPress={handleImagePicker} style={styles.modalImageContainer}>
                <Image source={{ uri: editedProfile.photoURL }} style={styles.modalAvatar} />
                <View style={styles.editImageOverlay}>
                  <Ionicons name="camera" size={24} color="white" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSection}>
              <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Display Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: currentTheme.surface, 
                  color: currentTheme.text,
                  borderColor: currentTheme.border 
                }]}
                value={editedProfile.displayName}
                onChangeText={(text) => setEditedProfile({ ...editedProfile, displayName: text })}
                placeholder="Enter your display name"
                placeholderTextColor={currentTheme.textSecondary}
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Bio</Text>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: currentTheme.surface, 
                  color: currentTheme.text,
                  borderColor: currentTheme.border 
                }]}
                value={editedProfile.bio}
                onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
                placeholder="Tell us about yourself"
                placeholderTextColor={currentTheme.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: SPACING.md,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  modalSave: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  modalSection: {
    marginVertical: SPACING.md,
  },
  modalImageContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
  },
  input: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  textArea: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    textAlignVertical: 'top',
    minHeight: 100,
  },
});
