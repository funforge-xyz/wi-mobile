
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../config/constants';

interface UserProfileActionsProps {
  onBlockUser: () => void;
  currentTheme: any;
  styles: any;
}

export default function UserProfileActions({ onBlockUser, currentTheme, styles }: UserProfileActionsProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.menuSection, { backgroundColor: currentTheme.surface }]}>
      <TouchableOpacity style={styles.menuItem} onPress={onBlockUser}>
        <Ionicons name="ban-outline" size={20} color={COLORS.error} />
        <Text style={[styles.menuText, { color: COLORS.error }]}>{t('userProfile.blockUser')}</Text>
      </TouchableOpacity>
    </View>
  );
}
