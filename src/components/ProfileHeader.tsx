
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/ProfileStyles';

interface ProfileHeaderProps {
  title: string;
  onBackPress: () => void;
  currentTheme: any;
}

export default function ProfileHeader({ title, onBackPress, currentTheme }: ProfileHeaderProps) {
  return (
    <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
      <TouchableOpacity onPress={onBackPress}>
        <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
}
