import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../hooks/redux';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/TermsStyles';
import { getTermsSections, getLastUpdatedText } from '../utils/termsUtils';
import PolicyHeader from '../components/PolicyHeader';
import PolicySection from '../components/PolicySection';
import PolicyFooter from '../components/PolicyFooter';
import { getTheme } from '../theme';

export default function TermsScreen() {
  const navigation = useNavigation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const currentTheme = getTheme(isDarkMode);
  const termsSections = getTermsSections(t);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <PolicyHeader
        title={t('terms.title')}
        onBackPress={() => navigation.goBack()}
        currentTheme={currentTheme}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {termsSections.map((section, index) => (
          <PolicySection
            key={index}
            title={section.title}
            text={section.content}
            currentTheme={currentTheme}
          />
        ))}

        <PolicyFooter
          lastUpdatedText={getLastUpdatedText(t)}
          currentTheme={currentTheme}
        />
      </ScrollView>
    </SafeAreaView>
  );
}