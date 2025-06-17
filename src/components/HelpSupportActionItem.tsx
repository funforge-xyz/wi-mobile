
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/HelpSupportStyles';

interface HelpSupportActionItemProps {
  iconName: keyof typeof Ionicons.glyphMap;
  text: string;
  onPress: () => void;
  showChevron?: boolean;
  rightText?: string;
  currentTheme: {
    text: string;
    textSecondary: string;
    border: string;
  };
  isLast?: boolean;
}

export default function HelpSupportActionItem({
  iconName,
  text,
  onPress,
  showChevron = true,
  rightText,
  currentTheme,
  isLast = false,
}: HelpSupportActionItemProps) {
  return (
    <TouchableOpacity
      style={[
        styles.actionItem,
        { borderBottomColor: isLast ? 'transparent' : currentTheme.border }
      ]}
      onPress={onPress}
    >
      <Ionicons name={iconName} size={20} color={currentTheme.text} />
      <Text style={[styles.actionText, { color: currentTheme.text }]}>{text}</Text>
      {rightText ? (
        <Text style={[styles.versionText, { color: currentTheme.textSecondary }]}>{rightText}</Text>
      ) : showChevron ? (
        <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
      ) : null}
    </TouchableOpacity>
  );
}
