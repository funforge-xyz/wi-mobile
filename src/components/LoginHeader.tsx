import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface LoginHeaderProps {
  currentTheme: any;
  styles: any;
  onLanguagePress?: () => void;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
}

export default function LoginHeader({ currentTheme, styles, onLanguagePress, onThemeToggle, isDarkMode }: LoginHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: currentTheme.text }]}>
        {t('auth.welcome')}
      </Text>
      <View style={styles.headerButtons}>
        {onThemeToggle && (
          <TouchableOpacity 
            style={styles.themeButton} 
            onPress={onThemeToggle}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isDarkMode ? "sunny" : "moon"} 
              size={24} 
              color={currentTheme.textSecondary} 
            />
          </TouchableOpacity>
        )}
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
    </View>
  );
}