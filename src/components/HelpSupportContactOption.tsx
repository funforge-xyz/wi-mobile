
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/HelpSupportStyles';

interface HelpSupportContactOptionProps {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  currentTheme: {
    text: string;
    textSecondary: string;
    surface: string;
  };
}

export default function HelpSupportContactOption({
  iconName,
  iconColor,
  title,
  subtitle,
  onPress,
  currentTheme,
}: HelpSupportContactOptionProps) {
  return (
    <TouchableOpacity
      style={[styles.contactOption, { backgroundColor: currentTheme.surface }]}
      onPress={onPress}
    >
      <Ionicons name={iconName} size={24} color={iconColor} />
      <View style={styles.contactOptionText}>
        <Text style={[styles.contactOptionTitle, { color: currentTheme.text }]}>{title}</Text>
        <Text style={[styles.contactOptionSubtitle, { color: currentTheme.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
