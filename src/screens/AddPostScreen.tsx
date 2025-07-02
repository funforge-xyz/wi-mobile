
import React, { useState, useRef, useEffect } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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
import { useNavigation, useRoute } from '@react-navigation/native';

interface AddPostScreenRouteParams {
  mediaUri?: string;
  mediaType?: 'image' | 'video';
}

export default function AddPostScreen() {
  const route = useRoute();
  const routeParams = route.params as AddPostScreenRouteParams | undefined;
  
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [showLikeCount, setShowLikeCount] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [selectedMedia, setSelectedMedia] = useState<string | null>(routeParams?.mediaUri || null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(routeParams?.mediaType || null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  
  console.log('AddPostScreen render - routeParams:', routeParams);
  const textInputRef = useRef<any>(null);
  const navigation = useNavigation();

  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();
  const { addNewPost } = usePostActions();

  const currentTheme = getTheme(isDarkMode);

  // For Flutter Wi flow: media is required, but description is optional
  const canPost = Boolean(selectedMedia);

  // If no media is provided via route params, open camera immediately
  useEffect(() => {
    if (!selectedMedia) {
      console.log('No media provided, opening camera modal');
      setShowCameraModal(true);
    }
  }, [selectedMedia]);

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

  const handleCameraClose = () => {
    console.log('Camera modal closing');
    setShowCameraModal(false);
    
    // If no media was captured and we were opening camera because no media was provided,
    // navigate back since this is a media-first flow
    if (!selectedMedia && !routeParams?.mediaUri) {
      console.log('No media captured, navigating back');
      navigation.goBack();
    }
  };

  const showMediaOptions = () => {
    if (selectedMedia) {
      const mediaText = mediaType === 'video' ? 'Video' : 'Photo';
      Alert.alert(
        t('addPost.selectMedia', `Select ${mediaText}`),
        t('addPost.useCameraToAdd', 'Use camera to add media'),
        [
          {
            text: t('addPost.openCamera', 'Retake'),
            onPress: () => {
              console.log('Opening camera modal to retake');
              setModalKey(prev => prev + 1);
              setShowCameraModal(true);
            },
          },
          {
            text: t('common.cancel', 'Cancel'),
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    }
  };

  const handlePost = async () => {
    if (!canPost) {
      Alert.alert(t('common.error'), t('addPost.mediaRequired', 'Media is required to create a post'));
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
        content: content.trim(),
        mediaURL: selectedMedia || '',
        mediaType: mediaType || 'image',
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
          onMediaPress={showMediaOptions}
          onRemoveMedia={() => {
            // In Flutter Wi flow, removing media means going back since media is required
            Alert.alert(
              t('addPost.removeMedia', 'Remove Media'),
              t('addPost.removeMediaWarning', 'Media is required for posts. Removing it will close this screen.'),
              [
                {
                  text: t('common.cancel', 'Cancel'),
                  style: 'cancel',
                },
                {
                  text: t('addPost.removeAndClose', 'Remove & Close'),
                  style: 'destructive',
                  onPress: () => {
                    setSelectedMedia(null);
                    setMediaType(null);
                    navigation.goBack();
                  },
                },
              ]
            );
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
        key={modalKey}
        visible={showCameraModal}
        onClose={handleCameraClose}
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
