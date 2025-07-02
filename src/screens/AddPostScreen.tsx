import { useState, useRef } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import { CameraView } from 'expo-camera';
import { useAppSelector } from '../hooks/redux';
import { useTranslation } from 'react-i18next';
import { usePostActions } from '../hooks/usePostActions';
import { compressImage, compressVideo } from '../utils/imageUtils';
import { createPost, PostData } from '../utils/postUtils';
import { addPostStyles } from '../styles/AddPostStyles';
import { getTheme } from '../theme';
import AddPostHeader from '../components/AddPostHeader';
import AddPostForm from '../components/AddPostForm';
import SuccessModal from '../components/SuccessModal';
import CustomCameraModal from '../components/CustomCameraModal';
import { useNavigation } from '@react-navigation/native';

export default function AddPostScreen() {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const [allowComments, setAllowComments] = useState(true);
  const [showLikeCount, setShowLikeCount] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  console.log('AddPostScreen render - showCameraModal:', showCameraModal);
  const textInputRef = useRef<any>(null);
  const navigation = useNavigation();

  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();
  const { addNewPost } = usePostActions();

  const currentTheme = getTheme(isDarkMode);
  const canPost = Boolean(content.trim() || selectedMedia);

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
      navigation.navigate('Profile' as never);
    });
  };

  const resetForm = () => {
    setContent('');
    setSelectedMedia(null);
    setMediaType(null);
    setAllowComments(true);
    setShowLikeCount(true);
  };

  const handleMediaCapture = async (mediaUri: string, type: 'image' | 'video') => {
    try {
      let compressedUri = mediaUri;
      
      if (type === 'image') {
        compressedUri = await compressImage(mediaUri);
      } else if (type === 'video') {
        compressedUri = await compressVideo(mediaUri);
      }
      
      setSelectedMedia(compressedUri);
      setMediaType(type);
      setShowCameraModal(false);
    } catch (error) {
      console.error('Media processing error:', error);
      const errorMessage = type === 'image' 
        ? 'Unable to compress image below 5MB. Please take a photo with better lighting or closer subject.'
        : 'Unable to compress video below 50MB. Please record a shorter video.';
      Alert.alert('Media Too Large', errorMessage);
    }
  };

  const showMediaPicker = () => {
    console.log('showMediaPicker called, selectedMedia:', selectedMedia);
    if (selectedMedia) {
      const mediaText = mediaType === 'video' ? 'Video' : 'Photo';
      Alert.alert(
        t('addPost.selectMedia', `Select ${mediaText}`),
        t('addPost.useCameraToAdd', 'Use camera to add media'),
        [
          {
            text: t('addPost.openCamera', 'Open Camera'),
            onPress: () => {
              console.log('Opening camera modal from alert');
              setShowCameraModal(true);
            },
          },
          {
            text: t('addPost.removeMedia', `Remove ${mediaText}`),
            onPress: () => {
              setSelectedMedia(null);
              setMediaType(null);
            },
            style: 'destructive',
          },
          {
            text: t('common.cancel', 'Cancel'),
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } else {
      // No media selected - open camera modal directly
      console.log('No media selected, opening camera modal directly');
      setShowCameraModal(true);
    }
  };

  const handlePost = async () => {
    if (!canPost) {
      Alert.alert(t('common.error'), t('addPost.addContentError', 'Please add some content or an image to your post'));
      return;
    }

    // Blur input and dismiss keyboard immediately
    if (textInputRef.current) {
      textInputRef.current.blur();
    }
    Keyboard.dismiss();

    setIsPosting(true);
    try {
      const postData: PostData = {
        content,
        mediaURL: selectedMedia || '',
        mediaType: mediaType || undefined,
        allowComments,
        showLikeCount,
      };

      // Create a wrapper function that matches the expected signature
      const translateWrapper = (key: string, fallback?: string) => {
        return fallback ? t(key, fallback) : t(key);
      };

      const newPostId = await createPost(postData, translateWrapper);

      // Add the new post to Redux store immediately
      addNewPost({
        id: newPostId,
        content: content.trim(),
        mediaURL: selectedMedia || '',
        mediaType: mediaType || 'image',
        createdAt: new Date().toISOString(),
        likesCount: 0,
        commentsCount: 0,
        showLikeCount: showLikeCount,
        allowComments: allowComments,
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
      />

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={100}
      >
        <AddPostForm
          content={content}
          onContentChange={setContent}
          selectedMedia={selectedMedia}
          mediaType={mediaType}
          onMediaPress={showMediaPicker}
          onRemoveMedia={() => {
            setSelectedMedia(null);
            setMediaType(null);
          }}
          allowComments={allowComments}
          onAllowCommentsToggle={() => setAllowComments(!allowComments)}
          showLikeCount={showLikeCount}
          onShowLikeCountToggle={() => setShowLikeCount(!showLikeCount)}
          currentTheme={currentTheme}
          textInputRef={textInputRef}
        />
      </KeyboardAwareScrollView>

      <CustomCameraModal
        visible={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onMediaCaptured={handleMediaCapture}
        currentTheme={currentTheme}
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