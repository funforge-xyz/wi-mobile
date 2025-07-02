import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Image,
  Switch,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { addPostStyles } from '../styles/AddPostStyles';
import { COLORS } from '../config/constants';

interface AddPostFormProps {
  content: string;
  onContentChange: (text: string) => void;
  selectedMedia: string | null;
  mediaType: 'image' | 'video' | null;
  onMediaPress: () => void;
  onRemoveMedia: () => void;
  allowComments: boolean;
  onAllowCommentsToggle: () => void;
  showLikeCount: boolean;
  onShowLikeCountToggle: () => void;
  currentTheme: any;
  textInputRef: any;
}

export default function AddPostForm({
  content,
  onContentChange,
  selectedMedia,
  mediaType,
  onMediaPress,
  onRemoveMedia,
  allowComments,
  onAllowCommentsToggle,
  showLikeCount,
  onShowLikeCountToggle,
  currentTheme,
  textInputRef,
}: AddPostFormProps) {
  const { t } = useTranslation();

  return (
    <View style={addPostStyles.content}>
      <TextInput
        ref={textInputRef}
        style={[addPostStyles.textInput, { color: currentTheme.text }]}
        placeholder={t('addPost.whatsOnMind')}
        placeholderTextColor={currentTheme.textSecondary}
        value={content}
        onChangeText={onContentChange}
        multiline
        maxLength={500}
        textAlignVertical="top"
      />

        <View style={addPostStyles.characterCount}>
          <Text style={[addPostStyles.characterCountText, { color: currentTheme.textSecondary }]}>
            {content.length}/500
          </Text>
        </View>

        <View style={addPostStyles.imageSection}>
          <TouchableOpacity 
            style={[addPostStyles.imagePickerContainer, { 
              backgroundColor: currentTheme.surface,
              borderColor: currentTheme.border 
            }]} 
            onPress={() => {
              console.log('Media button pressed - calling onMediaPress');
              onMediaPress();
            }}
            activeOpacity={0.7}
          >
            {selectedMedia ? (
              <View style={addPostStyles.imagePreviewContainer}>
              {mediaType === 'video' ? (
              <View style={addPostStyles.videoContainer}>
                <Video
                  source={{ uri: selectedMedia }}
                  style={addPostStyles.selectedImage}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={false}
                />
              </View>
            ) : (
                 <Image source={{ uri: selectedMedia }} style={addPostStyles.selectedImage} />
            )}
                <Text style={[addPostStyles.imagePickerText, { color: currentTheme.text }]}>
                  {t('addPost.photoSelected', 'Photo Selected')}
                </Text>
              </View>
            ) : (
              <View style={addPostStyles.imagePickerContent}>
                <Ionicons name="camera-outline" size={20} color={currentTheme.textSecondary} />
                <Text style={[addPostStyles.imagePickerText, { color: currentTheme.textSecondary }]}>
                  {t('addPost.takePhotoOptional', 'Take Photo (optional)')}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {selectedMedia && (
            <TouchableOpacity
              onPress={onRemoveMedia}
              style={addPostStyles.removeImageLink}
            >
              <Text style={[addPostStyles.removeImageText, { color: currentTheme.error || COLORS.error }]}>
                {t('addPost.removePhoto', 'Remove Photo')}
              </Text>
            </TouchableOpacity>
          )}
        </View>



        <View style={[addPostStyles.optionsContainer, { backgroundColor: currentTheme.surface }]}>
          <TouchableOpacity style={addPostStyles.option} onPress={onAllowCommentsToggle}>
            <Ionicons 
              name="chatbubble-outline" 
              size={20} 
              color={currentTheme.textSecondary} 
            />
            <View style={addPostStyles.optionTextContainer}>
              <Text style={[addPostStyles.optionText, { color: currentTheme.text }]}>
                {t('addPost.allowComments', 'Allow Comments')}
              </Text>
              <Text style={[addPostStyles.optionSubtext, { color: currentTheme.textSecondary }]}>
                {allowComments ? t('addPost.commentsEnabled', 'People can comment on this post') : t('addPost.commentsDisabled', 'Comments are disabled')}
              </Text>
            </View>
            <View style={[addPostStyles.switchContainer, { backgroundColor: allowComments ? COLORS.primary : currentTheme.border }]}>
              <View style={[addPostStyles.switchThumb, { 
                backgroundColor: 'white',
                transform: [{ translateX: allowComments ? 18 : 2 }] 
              }]} />
            </View>
          </TouchableOpacity>

          <View style={[addPostStyles.separator, { backgroundColor: currentTheme.border }]} />

          <TouchableOpacity style={addPostStyles.option} onPress={onShowLikeCountToggle}>
            <Ionicons 
              name="heart-outline" 
              size={20} 
              color={currentTheme.textSecondary} 
            />
            <View style={addPostStyles.optionTextContainer}>
              <Text style={[addPostStyles.optionText, { color: currentTheme.text }]}>
                {t('addPost.showLikeCount', 'Show Like Count')}
              </Text>
              <Text style={[addPostStyles.optionSubtext, { color: currentTheme.textSecondary }]}>
                {showLikeCount ? t('addPost.likeCountVisible', 'Like count is visible') : t('addPost.likeCountHidden', 'Like count is hidden')}
              </Text>
            </View>
            <View style={[addPostStyles.switchContainer, { backgroundColor: showLikeCount ? COLORS.primary : currentTheme.border }]}>
              <View style={[addPostStyles.switchThumb, { 
                backgroundColor: 'white',
                transform: [{ translateX: showLikeCount ? 18 : 2 }] 
              }]} />
            </View>
          </TouchableOpacity>
        </View>
    </View>
  );
}