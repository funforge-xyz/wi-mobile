import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface LoginHeaderProps {
  currentTheme: any;
  styles: any;
  onLanguagePress?: () => void;
}

export default function LoginHeader({ currentTheme, styles, onLanguagePress }: LoginHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: currentTheme.text }]}>
        {t('auth.welcome')}
      </Text>
      {onLanguagePress && (
        <TouchableOpacity 
          style={styles.languageButton} 
          onPress={onLanguagePress}
          activeOpacity={0.7}
        >
          <Ionicons name="language" size={24} color={currentTheme.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}