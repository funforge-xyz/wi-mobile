
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { addPostStyles } from '../styles/AddPostStyles';
import { useTranslation } from 'react-i18next';

interface AddPostFormProps {
  content: string;
  onContentChange: (text: string) => void;
  selectedImage: string | null;
  onImagePress: () => void;
  onRemoveImage: () => void;
  allowComments: boolean;
  onAllowCommentsToggle: () => void;
  showLikeCount: boolean;
  onShowLikeCountToggle: () => void;
  currentTheme: any;
  textInputRef?: any;
}

export default function AddPostForm({
  content,
  onContentChange,
  selectedImage,
  onImagePress,
  onRemoveImage,
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
            onPress={onImagePress}
          >
            <View style={addPostStyles.imagePickerContent}>
              <Ionicons name="camera-outline" size={20} color={currentTheme.textSecondary} />
              <Text style={[addPostStyles.imagePickerText, { color: currentTheme.textSecondary }]}>
                {selectedImage ? t('addPost.changePhoto', 'Change Photo') : t('addPost.takePhotoOptional', 'Take Photo (optional)')}
              </Text>
            </View>
            {selectedImage && (
              <View style={addPostStyles.selectedImageContainer}>
                <Image source={{ uri: selectedImage }} style={addPostStyles.selectedImage} />
                <TouchableOpacity 
                  style={addPostStyles.removeImageButton} 
                  onPress={onRemoveImage}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
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
