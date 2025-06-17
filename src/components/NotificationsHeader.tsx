
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { styles } from '../styles/NotificationsStyles';

interface NotificationsHeaderProps {
  currentTheme: any;
  t: any;
  onGoBack: () => void;
  onMarkAllRead: () => void;
}

export default function NotificationsHeader({ 
  currentTheme, 
  t, 
  onGoBack, 
  onMarkAllRead 
}: NotificationsHeaderProps) {
  return (
    <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
      <TouchableOpacity onPress={onGoBack}>
        <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
        {t('notifications.title')}
      </Text>
      <TouchableOpacity onPress={onMarkAllRead}>
        <Text style={[styles.markAllText, { color: COLORS.primary }]}>
          {t('notifications.markAllRead')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
