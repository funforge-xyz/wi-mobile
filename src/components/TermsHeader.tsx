import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

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