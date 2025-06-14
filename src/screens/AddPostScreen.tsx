import React, { useState } from 'react';
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
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  Animated,
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
import { useTranslation } from 'react-i18next';
import { usePostActions } from '../hooks/usePostActions';

export default function AddPostScreen() {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [showLikeCount, setShowLikeCount] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const settings = new Settings();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { addNewPost } = usePostActions();

  const showSuccessModalWithAnimation = () => {
    setShowSuccessModal(true);
    Animated.sequence([
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessModal(false);
      resetForm();
    });
  };

  const resetForm = () => {
    setContent('');
    setSelectedImage(null);
    setIsPrivate(false);
    setAllowComments(true);
    setShowLikeCount(true);
  };

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
      ? [t('addPost.takePhoto', 'Take Photo'), t('addPost.removePhoto', 'Remove Photo'), t('common.cancel')]
      : [t('addPost.takePhoto', 'Take Photo'), t('common.cancel')];

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
          text: t('addPost.takePhoto', 'Take Photo'),
          onPress: handleCameraCapture,
        },
      ];

      if (selectedImage) {
        alertOptions.push({
          text: t('addPost.removePhoto', 'Remove Photo'),
          onPress: () => setSelectedImage(''),
          style: 'destructive' as const,
        });
      }

      alertOptions.push({
        text: t('common.cancel'),
        style: 'cancel' as const,
      });

      Alert.alert(
        t('addPost.selectPhoto', 'Select Photo'),
        t('addPost.useCameraToAdd', 'Use camera to add a photo'),
        alertOptions,
        { cancelable: true }
      );
    }
  };

  const handleCancel = () => {
    if (content.trim() || selectedImage) {
      Alert.alert(
        t('addPost.discardPost', 'Discard Post'),
        t('addPost.discardPostMessage', 'Are you sure you want to discard this post?'),
        [
          {
            text: t('addPost.keepEditing', 'Keep Editing'),
            style: 'cancel',
          },
          {
            text: t('addPost.discard', 'Discard'),
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
      Alert.alert(t('common.error'), t('addPost.addContentError', 'Please add some content or an image to your post'));
      return;
    }

    setIsPosting(true);
    try {
      // Get current user
      const { getAuth } = await import('../services/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser || await authService.getCurrentUser();

      if (!currentUser) {
        Alert.alert(t('common.error'), t('addPost.loginRequired', 'You must be logged in to create a post'));
        return;
      }

      let mediaURL = '';

      // Upload image if selected
      if (selectedImage) {
        try {
          mediaURL = await storageService.uploadPostImage(currentUser.uid, selectedImage);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          Alert.alert(t('common.error'), t('addPost.uploadFailed', 'Failed to upload image'));
          setIsPosting(false);
          return;
        }
      }

      // Create post in Firestore
      const firestore = getFirestore();
      const postsCollection = collection(firestore, 'posts');

      const newPostDoc = await addDoc(postsCollection, {
        authorId: currentUser.uid,
        content: content.trim(),
        mediaURL: mediaURL || null,
        thumbURL: mediaURL || null,
        isPrivate: isPrivate,
        allowComments: allowComments,
        showLikeCount: showLikeCount,
        createdAt: serverTimestamp(),
      });

      // Add the new post to Redux store immediately
      addNewPost({
        id: newPostDoc.id,
        content: content.trim(),
        mediaURL: mediaURL || '',
        mediaType: 'image',
        createdAt: new Date().toISOString(),
        likesCount: 0,
        commentsCount: 0,
        showLikeCount: showLikeCount,
        allowComments: allowComments,
        isPrivate: isPrivate,
        isLikedByUser: false,
      });

      showSuccessModalWithAnimation();
    } catch (error) {
      console.error('Post creation error:', error);
      Alert.alert(t('common.error'), t('addPost.postFailed'));
    } finally {
      setIsPosting(false);
    }
  };

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{t('addPost.title')}</Text>
        <TouchableOpacity
          style={[styles.postButton, (!content.trim() && !selectedImage) && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={(!content.trim() && !selectedImage) || isPosting}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.postButtonText}>{isPosting ? t('addPost.posting') : t('addPost.post')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TextInput
          style={[styles.textInput, { color: currentTheme.text }]}
          placeholder={t('addPost.whatsOnMind')}
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
                  {selectedImage ? t('addPost.changePhoto', 'Change Photo') : t('addPost.takePhotoOptional', 'Take Photo (optional)')}
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
                {isPrivate ? t('addPost.private', 'Private') : t('addPost.public', 'Public')}
              </Text>
              <Text style={[styles.privacySubtext, { color: currentTheme.textSecondary }]}>
                {isPrivate ? t('addPost.privateDescription', 'Only you can see this post') : t('addPost.publicDescription', 'Anyone can see this post')}
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
                {t('addPost.allowComments', 'Allow Comments')}
              </Text>
              <Text style={[styles.optionSubtext, { color: currentTheme.textSecondary }]}>
                {allowComments ? t('addPost.commentsEnabled', 'People can comment on this post') : t('addPost.commentsDisabled', 'Comments are disabled')}
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
                {t('addPost.showLikeCount', 'Show Like Count')}
              </Text>
              <Text style={[styles.optionSubtext, { color: currentTheme.textSecondary }]}>
                {showLikeCount ? t('addPost.likeCountVisible', 'Like count is visible') : t('addPost.likeCountHidden', 'Like count is hidden')}
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
      </TouchableWithoutFeedback>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.successModal,
              {
                backgroundColor: currentTheme.surface,
                transform: [
                  {
                    scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                opacity: modalAnimation,
              },
            ]}
          >
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color={COLORS.success} />
            </View>
            <Text style={[styles.successTitle, { color: currentTheme.text }]}>
              {t('addPost.success', 'Success')}
            </Text>
            <Text style={[styles.successMessage, { color: currentTheme.textSecondary }]}>
              {t('addPost.postShared', 'Your post has been shared!')}
            </Text>
          </Animated.View>
        </View>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    width: 280,
    padding: SPACING.xl,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  successIconContainer: {
    marginBottom: SPACING.md,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
});