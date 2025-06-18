
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { addPostStyles } from '../styles/AddPostStyles';
import { useTranslation } from 'react-i18next';

interface AddPostHeaderProps {
  title: string;
  isPosting: boolean;
  canPost: boolean;
  onPostPress: () => void;
  currentTheme: any;
}

export default function AddPostHeader({
  title,
  isPosting,
  canPost,
  onPostPress,
  currentTheme,
}: AddPostHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={[addPostStyles.header, { borderBottomColor: currentTheme.border }]}>
      <Text style={[addPostStyles.headerTitle, { color: currentTheme.text }]}>{title}</Text>
      <TouchableOpacity
        style={[addPostStyles.postButton, !canPost && addPostStyles.postButtonDisabled]}
        onPress={onPostPress}
        disabled={!canPost || isPosting}
      >
        {isPosting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={addPostStyles.postButtonText}>
            {isPosting ? t('addPost.posting') : t('addPost.post')}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
