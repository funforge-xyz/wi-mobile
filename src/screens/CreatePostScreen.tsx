import React, { useState, useRef, useEffect } from 'react';
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
import { VideoView, useVideoPlayer } from 'expo-video';
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
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [showLikeCount, setShowLikeCount] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isFullscreenPlaying, setIsFullscreenPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const textInputRef = useRef<TextInput>(null);
  const successAnimation = useRef(new Animated.Value(0)).current;
  const videoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const navigation = useNavigation();
  const route = useRoute();
  const { mediaUri, mediaType } = route.params as CreatePostRouteParams;

  // Initialize video player for video preview - exact same as CameraScreen
  const previewPlayer = useVideoPlayer(mediaUri && mediaType === 'video' ? mediaUri : '', player => {
    player.loop = true;
    player.muted = isMuted;
  });

  const fullscreenPlayer = useVideoPlayer(mediaUri || '', player => {
    player.loop = true;
    player.muted = false;
  });

  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();
  const { addNewPost } = usePostActions();
  const currentTheme = getTheme(isDarkMode);

  const canPost = Boolean(mediaUri);

  // Pause any playing video when screen loads and manage timer
  useEffect(() => {
    if (previewPlayer && mediaType === 'video') {
      // Set up player status listener
      const unsubscribe = previewPlayer.addListener('statusChange', (status) => {
        console.log('Video status changed:', status);
        if (status === 'readyToPlay') {
          setIsVideoPlaying(false); // Start paused
          setVideoDuration(previewPlayer.duration || 15); // Default to 15s if duration not available
          setCurrentTime(0); // Reset current time
        }
      });

      // Set up time update listener for progress
      const timeUpdateUnsubscribe = previewPlayer.addListener('timeUpdate', (payload) => {
        console.log('Time update:', payload.currentTime); // Debug log
        if (payload.currentTime !== undefined) {
          setCurrentTime(payload.currentTime);
          if (videoDuration > 0) {
            setVideoProgress((payload.currentTime / videoDuration) * 100);
          }
        }
      });

      return () => {
        unsubscribe?.remove();
        timeUpdateUnsubscribe?.remove();
      };
    }
  }, [previewPlayer, mediaType, videoDuration]);

  // Add a manual timer as backup when video is playing
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isVideoPlaying && previewPlayer) {
      interval = setInterval(() => {
        const playerCurrentTime = previewPlayer.currentTime || 0;
        setCurrentTime(playerCurrentTime);
        if (videoDuration > 0) {
          setVideoProgress((playerCurrentTime / videoDuration) * 100);
        }
      }, 100); // Update every 100ms for smooth counter
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isVideoPlaying, previewPlayer, videoDuration]);

  const toggleVideoPlay = () => {
    if (previewPlayer) {
      if (isVideoPlaying) {
        previewPlayer.pause();
      } else {
        previewPlayer.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const resetVideo = () => {
    if (previewPlayer) {
      previewPlayer.seekTo(0);
      previewPlayer.pause();
      setIsVideoPlaying(false);
      setCurrentTime(0);
      setVideoProgress(0);
    }
  };

  const toggleFullscreenPlay = () => {
    if (fullscreenPlayer) {
      if (isFullscreenPlaying) {
        fullscreenPlayer.pause();
      } else {
        fullscreenPlayer.play();
      }
      setIsFullscreenPlaying(!isFullscreenPlaying);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (previewPlayer) {
      previewPlayer.muted = !isMuted;
    }
  };

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
              style={[styles.mediaPreview, { borderRadius: 8 }]}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.videoPreviewContainer}>
              <View style={{ position: 'relative', width: '100%', height: '100%' }}>
              <VideoView
                style={styles.mediaPreview}
                player={previewPlayer}
                allowsFullscreen={false}
                allowsPictureInPicture={false}
                nativeControls={false}
              />

              {/* Video Counter */}
              <View
                style={{
                  position: 'absolute',
                  bottom: 15,
                  left: 0,
                  right: 0,
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 14,
                      fontWeight: '600',
                    }}
                  >
                    {String(Math.floor(currentTime / 60)).padStart(2, '0')}:
                    {String(Math.floor(currentTime % 60)).padStart(2, '0')}
                  </Text>
                </View>
              </View>
            </View>
              {/* Play/Pause Button Overlay - exact same as CameraScreen */}
              <TouchableOpacity
                onPress={toggleVideoPlay}
                onLongPress={resetVideo}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: [{ translateX: -30 }, { translateY: -30 }],
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons 
                  name={isVideoPlaying ? "pause" : "play"} 
                  size={30} 
                  color="white" 
                />
              </TouchableOpacity>
              {/* Mute button - exact same as CameraScreen */}
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={toggleMute}
              >
                <Ionicons 
                  name={isMuted ? "volume-mute" : "volume-high"} 
                  size={20} 
                  color="white" 
                />
              </TouchableOpacity>

              
              
            </View>
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
              onPress={() => {
                if (isFullscreenPlaying) {
                  fullscreenPlayer.pause();
                  setIsFullscreenPlaying(false);
                }
                setShowVideoModal(false);
              }}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <VideoView
              style={styles.fullscreenVideo}
              player={fullscreenPlayer}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
              nativeControls={false}
              contentFit="cover"
            />
            {/* Play/Pause Button Overlay */}
            <TouchableOpacity
              onPress={toggleFullscreenPlay}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: [{ translateX: -30 }, { translateY: -30 }],
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: 'rgba(0,0,0,0.6)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons 
                name={isFullscreenPlaying ? "pause" : "play"} 
                size={30} 
                color="white" 
              />
            </TouchableOpacity>
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
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={[
              styles.bottomPostButton,
              !canPost && styles.postButtonDisabled,
            ]}
            disabled={!canPost || isPosting}
            onPress={handlePost}
          >
            {isPosting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.postButtonText}>
                {t('addPost.post', 'Post')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
  bottomButtonContainer: {
    alignItems: 'flex-end',
  },
  bottomPostButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
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
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  mediaPreview: {
    width: '100%',
    height: 240,
    borderRadius: 8,
  },
  videoPreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 240,
    borderRadius: 8,
    overflow: 'hidden',
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
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});