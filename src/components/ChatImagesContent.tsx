
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatImagesStyles } from '../styles/ChatImagesStyles';

interface ChatImagesContentProps {
  title: string;
  subtitle: string;
  currentTheme: any;
}

export default function ChatImagesContent({
  title,
  subtitle,
  currentTheme,
}: ChatImagesContentProps) {
  return (
    <View style={chatImagesStyles.content}>
      <View style={[chatImagesStyles.emptyStateIcon, { backgroundColor: currentTheme.surface }]}>
        <Ionicons name="images-outline" size={48} color={currentTheme.textSecondary} />
      </View>
      <Text style={[chatImagesStyles.title, { color: currentTheme.text }]}>
        {title}
      </Text>
      <Text style={[chatImagesStyles.subtitle, { color: currentTheme.textSecondary }]}>
        {subtitle}
      </Text>
    </View>
  );
}
