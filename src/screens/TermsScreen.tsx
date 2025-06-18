import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/redux';
import { getTheme, getTermsSections, getLastUpdatedText } from '../utils/termsUtils';
import { styles } from '../styles/TermsStyles';
import TermsHeader from '../components/TermsHeader';
import TermsSection from '../components/TermsSection';

export default function TermsScreen() {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const currentTheme = getTheme(isDarkMode);
  const termsSections = getTermsSections(t);
  const lastUpdatedText = getLastUpdatedText(t);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <TermsHeader currentTheme={currentTheme} styles={styles} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {termsSections.map((section, index) => (
          <TermsSection
            key={index}
            title={section.title}
            content={section.content}
            currentTheme={currentTheme}
            styles={styles}
          />
        ))}

        <TermsSection
          title=""
          content={lastUpdatedText}
          currentTheme={currentTheme}
          styles={styles}
          isLastUpdated={true}
        />
      </ScrollView>
    </SafeAreaView>
  );
}