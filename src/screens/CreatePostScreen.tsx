
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Switch,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useAppSelector } from '../hooks/redux';
import { useTranslation } from 'react-i18next';
import { usePostActions } from '../hooks/usePostActions';
import { createPost, PostData } from '../utils/postUtils';
import { getTheme } from '../theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONTS } from '../config/constants';

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
  
  const textInputRef = useRef<TextInput>(null);
  
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

      Alert.alert(
        t('addPost.success', 'Success'),
        t('addPost.postShared', 'Your post has been shared!'),
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Profile' as never),
          },
        ]
      );
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
        <TouchableOpacity
          style={[
            styles.postButton,
            !canPost && styles.postButtonDisabled,
          ]}
          disabled={!canPost || isPosting}
          onPress={handlePost}
        >
          <Text style={styles.postButtonText}>
            {isPosting ? t('addPost.posting', 'Posting...') : t('addPost.post', 'Post')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Media Preview */}
        <View style={styles.mediaPreviewContainer}>
          {mediaType === 'image' ? (
            <Image 
              source={{ uri: mediaUri }} 
              style={styles.mediaPreview}
              resizeMode="cover"
            />
          ) : (
            <TouchableOpacity 
              style={styles.videoPreviewContainer}
              onPress={() => setShowVideoModal(true)}
            >
              <Video
                source={{ uri: mediaUri }}
                style={styles.mediaPreview}
                resizeMode="cover"
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
          <View style={styles.characterCount}>
            <Text style={[styles.characterCountText, { color: currentTheme.textSecondary }]}>
              {content.length}/500
            </Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.settingsSection}>
          <View style={[styles.settingRow, { borderBottomColor: currentTheme.border }]}>
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
      </ScrollView>

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
  },
  mediaPreviewContainer: {
    margin: SPACING.md,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
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
  textInput: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
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
    borderBottomWidth: 1,
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
});
