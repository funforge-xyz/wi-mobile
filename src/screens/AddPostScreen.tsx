import React, { useState } from 'react';
import {
  View,
  Alert,
  Animated,
  Platform,
  AlertButton,
  ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAppSelector } from '../hooks/redux';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { usePostActions } from '../hooks/usePostActions';
import { compressImage } from '../utils/imageUtils';
import { createPost, showDiscardAlert, PostData } from '../utils/postUtils';
import { addPostStyles, lightTheme, darkTheme } from '../styles/AddPostStyles';
import AddPostHeader from '../components/AddPostHeader';
import AddPostForm from '../components/AddPostForm';
import SuccessModal from '../components/SuccessModal';

export default function AddPostScreen() {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [showLikeCount, setShowLikeCount] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { addNewPost } = usePostActions();

  const currentTheme = isDarkMode ? darkTheme : lightTheme;
  const canPost = content.trim() || selectedImage;

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
      const alertOptions: AlertButton[] = [
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
    const hasContent = content.trim() || selectedImage;

    showDiscardAlert(hasContent, () => {
      resetForm();
      navigation.goBack();
    }, t);
  };

  const handlePost = async () => {
    if (!canPost) {
      Alert.alert(t('common.error'), t('addPost.addContentError', 'Please add some content or an image to your post'));
      return;
    }

    setIsPosting(true);
    try {
      const postData: PostData = {
        content,
        mediaURL: selectedImage || '',
        isPrivate,
        allowComments,
        showLikeCount,
      };

      const newPostId = await createPost(postData, t);

      // Add the new post to Redux store immediately
      addNewPost({
        id: newPostId,
        content: content.trim(),
        mediaURL: selectedImage || '',
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

  return (
    <SafeAreaView style={[addPostStyles.container, { backgroundColor: currentTheme.background }]}>
      <AddPostHeader
        title={t('addPost.title')}
        isPosting={isPosting}
        canPost={canPost}
        onPostPress={handlePost}
        currentTheme={currentTheme}
        t={t}
      />

      <AddPostForm
        content={content}
        onContentChange={setContent}
        selectedImage={selectedImage}
        onImagePress={showImagePicker}
        onRemoveImage={() => setSelectedImage('')}
        isPrivate={isPrivate}
        onPrivacyToggle={() => setIsPrivate(!isPrivate)}
        allowComments={allowComments}
        onAllowCommentsToggle={() => setAllowComments(!allowComments)}
        showLikeCount={showLikeCount}
        onShowLikeCountToggle={() => setShowLikeCount(!showLikeCount)}
        currentTheme={currentTheme}
        t={t}
      />

      <SuccessModal
        visible={showSuccessModal}
        title={t('addPost.success', 'Success')}
        message={t('addPost.postShared', 'Your post has been shared!')}
        animation={modalAnimation}
        currentTheme={currentTheme}
      />
    </SafeAreaView>
  );
}