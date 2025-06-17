
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { addPostStyles } from '../styles/AddPostStyles';

interface AddPostHeaderProps {
  title: string;
  isPosting: boolean;
  canPost: boolean;
  onPostPress: () => void;
  currentTheme: any;
  t: (key: string, fallback?: string) => string;
}

export default function AddPostHeader({
  title,
  isPosting,
  canPost,
  onPostPress,
  currentTheme,
  t,
}: AddPostHeaderProps) {
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
