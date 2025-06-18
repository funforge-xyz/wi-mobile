import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS } from '../config/constants';

interface TermsHeaderProps {
  currentTheme: any;
  styles: any;
}

export default function TermsHeader({ currentTheme, styles }: TermsHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.header, { backgroundColor: currentTheme.surface }]}>
      <Text style={[styles.title, { color: currentTheme.text }]}>
        {t('terms.title')}
      </Text>
    </View>
  );
}