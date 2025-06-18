
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface UserPostsHeaderProps {
  currentTheme: any;
  styles: any;
  onSettingsPress: () => void;
}

export default function UserPostsHeader({ currentTheme, styles, onSettingsPress }: UserPostsHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
      <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
        {t('profile.myPosts')}
      </Text>
      <TouchableOpacity onPress={onSettingsPress}>
        <Ionicons name="settings-outline" size={24} color={currentTheme.text} />
      </TouchableOpacity>
    </View>
  );
}
