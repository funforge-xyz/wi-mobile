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
  ActionSheetIOS,
  Platform,
  AlertButton,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { Settings, storageService } from '../services/storage';
import { useAppSelector } from '../hooks/redux';
import { authService } from '../services/auth';
import { getFirestore } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

export default function AddPostScreen() {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [showLikeCount, setShowLikeCount] = useState(true);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const settings = new Settings();
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const compressImage = async (uri: string): Promise<string> => {
    try {
      // Get file info to check initial size
      const response = await fetch(uri);
      const blob = await response.blob();
      let initialSize = blob.size;
      
      console.log('Initial image size:', (initialSize / 1024 / 1024).toFixed(2), 'MB');
      
      // Start with high quality and reduce if needed
      let quality = 0.8;
      let compressedUri = uri;
      
      // Keep compressing until under 5MB or quality gets too low
      while (initialSize > 5242880 && quality > 0.1) { // 5MB = 5242880 bytes
        const result = await ImageManipulator.manipulateAsync(
          compressedUri,
          [{ resize: { width: 1920 } }], // Resize to max width 1920px
          {
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );
        
        // Check new file size
        const newResponse = await fetch(result.uri);
        const newBlob = await newResponse.blob();
        initialSize = newBlob.size;
        compressedUri = result.uri;
        
        console.log('Compressed to quality', quality, 'Size:', (initialSize / 1024 / 1024).toFixed(2), 'MB');
        
        // Reduce quality for next iteration
        quality -= 0.1;
      }
      
      // Final check
      if (initialSize > 5242880) {
        throw new Error('Unable to compress image below 5MB');
      }
      
      console.log('Final compressed size:', (initialSize / 1024 / 1024).toFixed(2), 'MB');
      return compressedUri;
    } catch (error) {
      console.error('Image compression error:', error);
      throw error;
    }
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access the photo library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      
      try {
        // Compress the image
        const compressedUri = await compressImage(asset.uri);
        setSelectedImage(compressedUri);
      } catch (error) {
        console.error('Image processing error:', error);
        Alert.alert('Image Too Large', 'Unable to compress image below 5MB. Please select a smaller image.');
      }
    }
  };

  const handleCameraCapture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access the camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      
      try {
        // Compress the image
        const compressedUri = await compressImage(asset.uri);
        setSelectedImage(compressedUri);
      } catch (error) {
        console.error('Image processing error:', error);
        Alert.alert('Image Too Large', 'Unable to compress image below 5MB. Please take a photo with better lighting or closer subject.');
      }
    }
  };

  const showImagePicker = () => {
    const options = selectedImage 
      ? ['Take Photo', 'Remove Photo', 'Cancel']
      : ['Take Photo', 'Cancel'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: selectedImage ? 2 : 1,
          destructiveButtonIndex: selectedImage ? 1 : undefined,
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            handleCameraCapture();
          } else if (buttonIndex === 1 && selectedImage) {
            setSelectedImage('');
          }
        }
      );
    } else {
      // For Android
      const alertOptions : AlertButton[] = [
        {
          text: 'Take Photo',
          onPress: handleCameraCapture,
        },
      ];

      if (selectedImage) {
        alertOptions.push({
          text: 'Remove Photo',
          onPress: () => setSelectedImage(''),
          style: 'destructive' as const,
        });
      }

      alertOptions.push({
        text: 'Cancel',
        style: 'cancel' as const,
      });

      Alert.alert(
        'Select Photo',
        'Use camera to add a photo',
        alertOptions,
        { cancelable: true }
      );
    }
  };

  const handleCancel = () => {
    if (content.trim() || selectedImage) {
      Alert.alert(
        'Discard Post',
        'Are you sure you want to discard this post?',
        [
          {
            text: 'Keep Editing',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setContent('');
              setSelectedImage(null);
              setIsPrivate(false);
              setAllowComments(true);
              setShowLikeCount(true);
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  

  const handlePost = async () => {
    if (!content.trim() && !selectedImage) {
      Alert.alert('Error', 'Please add some content or an image to your post');
      return;
    }

    setIsPosting(true);
    try {
      // Get current user
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser || await authService.getCurrentUser();

      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to create a post');
        return;
      }

      let mediaURL = '';
      
      // Upload image if selected
      if (selectedImage) {
        try {
          mediaURL = await storageService.uploadPostImage(currentUser.uid, selectedImage);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          Alert.alert('Error', 'Failed to upload image');
          setIsPosting(false);
          return;
        }
      }

      // Create post in Firestore
      const firestore = getFirestore();
      const postsCollection = collection(firestore, 'posts');
      
      await addDoc(postsCollection, {
        authorId: currentUser.uid,
        content: content.trim(),
        mediaURL: mediaURL || null,
        thumbURL: mediaURL || null,
        isPrivate: isPrivate,
        allowComments: allowComments,
        showLikeCount: showLikeCount,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Your post has been shared!', [
        { text: 'OK', onPress: () => {
          setContent('');
          setSelectedImage(null);
          setIsPrivate(false);
          setAllowComments(true);
          setShowLikeCount(true);
        }}
      ]);
    } catch (error) {
      console.error('Post creation error:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={[styles.cancelText, { color: currentTheme.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>New Post</Text>
        <TouchableOpacity
          style={[styles.postButton, (!content.trim() && !selectedImage) && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={(!content.trim() && !selectedImage) || isPosting}
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
         <View style={styles.imageSection}>
            <TouchableOpacity style={[styles.imagePickerContainer, { 
              backgroundColor: currentTheme.surface,
              borderColor: currentTheme.border 
            }]} onPress={showImagePicker}>
              <View style={styles.imagePickerContent}>
                <Ionicons name="camera-outline" size={20} color={currentTheme.textSecondary} />
                <Text style={[styles.imagePickerText, { color: currentTheme.textSecondary }]}>
                  {selectedImage ? 'Change Photo' : 'Take Photo (optional)'}
                </Text>
              </View>
              {selectedImage && (
                <View style={styles.selectedImageContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton} 
                    onPress={() => setSelectedImage('')}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          </View>

        

        <View style={[styles.privacyContainer, { backgroundColor: currentTheme.surface }]}>
          <TouchableOpacity style={styles.privacyOption} onPress={() => setIsPrivate(!isPrivate)}>
            <Ionicons 
              name={isPrivate ? "lock-closed-outline" : "globe-outline"} 
              size={20} 
              color={currentTheme.textSecondary} 
            />
            <View style={styles.privacyTextContainer}>
              <Text style={[styles.privacyText, { color: currentTheme.text }]}>
                {isPrivate ? 'Private' : 'Public'}
              </Text>
              <Text style={[styles.privacySubtext, { color: currentTheme.textSecondary }]}>
                {isPrivate ? 'Only you can see this post' : 'Anyone can see this post'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.optionsContainer, { backgroundColor: currentTheme.surface }]}>
          <TouchableOpacity style={styles.option} onPress={() => setAllowComments(!allowComments)}>
            <Ionicons 
              name="chatbubble-outline" 
              size={20} 
              color={currentTheme.textSecondary} 
            />
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionText, { color: currentTheme.text }]}>
                Allow Comments
              </Text>
              <Text style={[styles.optionSubtext, { color: currentTheme.textSecondary }]}>
                {allowComments ? 'People can comment on this post' : 'Comments are disabled'}
              </Text>
            </View>
            <View style={[styles.switchContainer, { backgroundColor: allowComments ? COLORS.primary : currentTheme.border }]}>
              <View style={[styles.switchThumb, { 
                backgroundColor: 'white',
                transform: [{ translateX: allowComments ? 18 : 2 }] 
              }]} />
            </View>
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: currentTheme.border }]} />

          <TouchableOpacity style={styles.option} onPress={() => setShowLikeCount(!showLikeCount)}>
            <Ionicons 
              name="heart-outline" 
              size={20} 
              color={currentTheme.textSecondary} 
            />
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionText, { color: currentTheme.text }]}>
                Show Like Count
              </Text>
              <Text style={[styles.optionSubtext, { color: currentTheme.textSecondary }]}>
                {showLikeCount ? 'Like count is visible' : 'Like count is hidden'}
              </Text>
            </View>
            <View style={[styles.switchContainer, { backgroundColor: showLikeCount ? COLORS.primary : currentTheme.border }]}>
              <View style={[styles.switchThumb, { 
                backgroundColor: 'white',
                transform: [{ translateX: showLikeCount ? 18 : 2 }] 
              }]} />
            </View>
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
  
  privacyContainer: {
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyTextContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  privacyText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  privacySubtext: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  optionsContainer: {
    borderRadius: 12,
    padding: SPACING.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  optionText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  optionSubtext: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginVertical: SPACING.sm,
  },
    loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSection: {
    marginBottom: SPACING.lg,
  },
  imagePickerContainer: {
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  imagePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagePickerText: {
    marginLeft: SPACING.sm,
    fontSize: 16,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  selectedImageContainer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    position: 'relative',
  },
  selectedImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: '25%',
    backgroundColor: 'white',
    borderRadius: 12,
  },
  switchContainer: {
    width: 40,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
  },
});