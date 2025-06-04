
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { Settings } from '../services/storage';

export default function AddPostScreen() {
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const settings = new Settings();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const darkMode = await settings.getDarkMode();
    setIsDarkMode(darkMode);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access photo library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets) {
      const imageUris = result.assets.map(asset => asset.uri);
      setSelectedImages(prev => [...prev, ...imageUris]);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      setSelectedImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!content.trim() && selectedImages.length === 0) {
      Alert.alert('Error', 'Please add some content or images to your post');
      return;
    }

    setIsPosting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert('Success', 'Your post has been shared!', [
        { text: 'OK', onPress: () => {
          setContent('');
          setSelectedImages([]);
        }}
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <TouchableOpacity style={styles.cancelButton}>
          <Text style={[styles.cancelText, { color: currentTheme.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>New Post</Text>
        <TouchableOpacity
          style={[styles.postButton, (!content.trim() && selectedImages.length === 0) && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={(!content.trim() && selectedImages.length === 0) || isPosting}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TextInput
          style={[styles.textInput, { color: currentTheme.text }]}
          placeholder="What's on your mind?"
          placeholderTextColor={currentTheme.textSecondary}
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />

        <View style={styles.characterCount}>
          <Text style={[styles.characterCountText, { color: currentTheme.textSecondary }]}>
            {content.length}/500
          </Text>
        </View>

        {selectedImages.length > 0 && (
          <View style={styles.imagesContainer}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.optionsContainer}>
          <TouchableOpacity style={[styles.option, { borderBottomColor: currentTheme.border }]} onPress={showImageOptions}>
            <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
            <Text style={[styles.optionText, { color: currentTheme.text }]}>Add Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.option, { borderBottomColor: currentTheme.border }]}>
            <Ionicons name="location-outline" size={24} color={COLORS.primary} />
            <Text style={[styles.optionText, { color: currentTheme.text }]}>Add Location</Text>
            <View style={[styles.locationToggle, { backgroundColor: currentTheme.surface }]}>
              <Text style={styles.locationStatus}>
                {locationEnabled ? 'On' : 'Off'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.option, { borderBottomColor: currentTheme.border }]}>
            <Ionicons name="people-outline" size={24} color={COLORS.primary} />
            <Text style={[styles.optionText, { color: currentTheme.text }]}>Tag People</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.privacyContainer, { backgroundColor: currentTheme.surface }]}>
          <View style={styles.privacyOption}>
            <Ionicons name="globe-outline" size={20} color={currentTheme.textSecondary} />
            <Text style={[styles.privacyText, { color: currentTheme.text }]}>Public</Text>
            <Text style={[styles.privacySubtext, { color: currentTheme.textSecondary }]}>Anyone can see this post</Text>
          </View>
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
  cancelButton: {
    paddingVertical: SPACING.xs,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  postButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  postButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: 'white',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  textInput: {
    fontSize: 18,
    fontFamily: FONTS.regular,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: SPACING.sm,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginBottom: SPACING.lg,
  },
  characterCountText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  imagesContainer: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
  },
  imageContainer: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  optionsContainer: {
    marginBottom: SPACING.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.md,
    flex: 1,
  },
  locationToggle: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  locationStatus: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  privacyContainer: {
    borderRadius: 12,
    padding: SPACING.md,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.sm,
  },
  privacySubtext: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginLeft: 'auto',
  },
});
