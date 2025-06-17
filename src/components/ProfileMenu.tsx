
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { styles } from '../styles/ProfileStyles';

interface ProfileMenuProps {
  currentTheme: any;
  navigation: any;
  onSignOut: () => void;
  t: (key: string) => string;
}

export default function ProfileMenu({ currentTheme, navigation, onSignOut, t }: ProfileMenuProps) {
  return (
    <View style={[styles.menuSection, { backgroundColor: currentTheme.surface }]}>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
        <Ionicons name="settings-outline" size={20} color={currentTheme.text} />
        <Text style={[styles.menuText, { color: currentTheme.text }]}>{t('profile.settings')}</Text>
        <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('HelpSupport')}>
        <Ionicons name="help-circle-outline" size={20} color={currentTheme.text} />
        <Text style={[styles.menuText, { color: currentTheme.text }]}>{t('profile.helpSupport')}</Text>
        <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={onSignOut}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={[styles.menuText, { color: COLORS.error }]}>{t('profile.signOut')}</Text>
      </TouchableOpacity>
    </View>
  );
}
