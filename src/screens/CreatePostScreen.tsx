
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
  Modal,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useAppSelector } from '../hooks/redux';
import { useTranslation } from 'react-i18next';
import { usePostActions } from '../hooks/usePostActions';
import { createPost, PostData } from '../utils/postUtils';
import { getTheme } from '../theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONTS } from '../config/constants';
import SuccessModal from '../components/SuccessModal';

const { width, height } = Dimensions.get('window');

interface CreatePostRouteParams {
  mediaUri: string;
  mediaType: 'image' | 'video';
}

export default function CreatePostScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { mediaUri, mediaType } = route.params as CreatePostRouteParams;
  
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [showLikeCount, setShowLikeCount] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const textInputRef = useRef<TextInput>(null);
  const successAnimation = useRef(new Animated.Value(0)).current;
  
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();
  const { addNewPost } = usePostActions();
  const currentTheme = getTheme(isDarkMode);

  const canPost = Boolean(mediaUri);

  const handlePost = async () => {
    if (!canPost) {
      Alert.alert(t('common.error'), t('addPost.mediaRequired', 'Media is required to create a post'));
      return;
    }

    setIsPosting(true);
    try {
      const postData: PostData = {
        content: content.trim(),
        mediaURL: mediaUri,
        mediaType: mediaType,
        allowComments,
        showLikeCount,
      };

      const translateWrapper = (key: string, fallback?: string) => {
        return fallback ? t(key, fallback) : t(key);
      };

      const newPostId = await createPost(postData, translateWrapper);

      addNewPost({
        id: newPostId,
        content: content.trim(),
        mediaURL: mediaUri,
        mediaType: mediaType,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        commentsCount: 0,
        showLikeCount: showLikeCount,
        allowComments: allowComments,
        isLikedByUser: false,
      });

      // Show success modal
      setShowSuccessModal(true);
      Animated.timing(successAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-hide after 2 seconds then navigate
      setTimeout(() => {
        Animated.timing(successAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowSuccessModal(false);
          navigation.navigate('Profile' as never);
        });
      }, 2000);
    } catch (error) {
      console.error('Post creation error:', error);
      Alert.alert(t('common.error'), t('addPost.postFailed'));
    } finally {
      setIsPosting(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
          {t('addPost.createPost', 'Create Post')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAwareScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardOpeningTime={100}
        extraScrollHeight={20}
      >
        {/* Media Preview */}
        <View style={styles.mediaPreviewContainer}>
          {mediaType === 'image' ? (
            <Image 
              source={{ uri: mediaUri }} 
              style={styles.mediaPreview}
              resizeMode="contain"
            />
          ) : (
            <TouchableOpacity 
              style={styles.videoPreviewContainer}
              onPress={() => setShowVideoModal(true)}
            >
              <Video
                source={{ uri: mediaUri }}
                style={styles.mediaPreview}
                resizeMode="contain"
                shouldPlay={false}
                isMuted={true}
              />
              <View style={styles.playOverlay}>
                <Ionicons name="play" size={40} color="white" />
                <Text style={styles.previewText}>
                  {t('addPost.preview', 'Preview')}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Description Input */}
        <View style={styles.inputSection}>
          <View style={[styles.inputContainer, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
            <TextInput
              ref={textInputRef}
              style={[styles.textInput, { color: currentTheme.text }]}
              placeholder={t('addPost.whatsOnMind', "What's on your mind?")}
              placeholderTextColor={currentTheme.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
          </View>
          <View style={styles.characterCount}>
            <Text style={[styles.characterCountText, { color: currentTheme.textSecondary }]}>
              {content.length}/500
            </Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.settingsSection}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: currentTheme.text }]}>
              {t('addPost.allowComments', 'Allow Comments')}
            </Text>
            <Switch
              value={allowComments}
              onValueChange={setAllowComments}
              trackColor={{ false: currentTheme.border, true: COLORS.primary }}
              thumbColor={allowComments ? 'white' : currentTheme.textSecondary}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: currentTheme.text }]}>
              {t('addPost.showLikeCount', 'Show Like Count')}
            </Text>
            <Switch
              value={showLikeCount}
              onValueChange={setShowLikeCount}
              trackColor={{ false: currentTheme.border, true: COLORS.primary }}
              thumbColor={showLikeCount ? 'white' : currentTheme.textSecondary}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Video Modal */}
      {mediaType === 'video' && (
        <Modal
          visible={showVideoModal}
          animationType="fade"
          presentationStyle="fullScreen"
          statusBarTranslucent={true}
        >
          <View style={styles.videoModal}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowVideoModal(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Video
              source={{ uri: mediaUri }}
              style={styles.fullscreenVideo}
              resizeMode="contain"
              shouldPlay={true}
              isLooping={true}
              isMuted={false}
            />
          </View>
        </Modal>
      )}

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title={t('addPost.success', 'Success')}
        message={t('addPost.postShared', 'Your post has been shared!')}
        animation={successAnimation}
        currentTheme={currentTheme}
      />

      {/* Bottom Post Button */}
      <View style={[styles.bottomContainer, { backgroundColor: currentTheme.background, borderTopColor: currentTheme.border }]}>
        <TouchableOpacity
          style={[
            styles.bottomPostButton,
            !canPost && styles.postButtonDisabled,
          ]}
          disabled={!canPost || isPosting}
          onPress={handlePost}
        >
          {isPosting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="white" />
              <Text style={[styles.postButtonText, { marginLeft: 8 }]}>
                {t('addPost.posting', 'Posting...')}
              </Text>
            </View>
          ) : (
            <Text style={styles.postButtonText}>
              {t('addPost.post', 'Post')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  bottomContainer: {
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  bottomPostButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  mediaPreviewContainer: {
    margin: SPACING.md,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPreview: {
    width: '100%',
    height: 200,
  },
  videoPreviewContainer: {
    position: 'relative',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    color: 'white',
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginTop: SPACING.xs,
  },
  inputSection: {
    margin: SPACING.md,
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  textInput: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    alignItems: 'flex-end',
  },
  characterCountText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  settingsSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  videoModal: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenVideo: {
    width: width,
    height: height,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
