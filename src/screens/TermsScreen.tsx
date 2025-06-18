import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/redux';
import { getTheme } from '../utils/termsUtils';
import { styles } from '../styles/TermsStyles';
import TermsHeader from '../components/TermsHeader';
import TermsSection from '../components/TermsSection';

export default function TermsScreen() {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const currentTheme = getTheme(isDarkMode);

  const termsSections = [
    {
      title: t('terms.acceptanceTitle'),
      content: t('terms.acceptanceText')
    },
    {
      title: t('terms.privacyTitle'),
      content: t('terms.privacyText')
    },
    {
      title: t('terms.conductTitle'),
      content: t('terms.conductText')
    },
    {
      title: t('terms.contentTitle'),
      content: t('terms.contentText')
    },
    {
      title: t('terms.securityTitle'),
      content: t('terms.securityText')
    },
    {
      title: t('terms.liabilityTitle'),
      content: t('terms.liabilityText')
    },
    {
      title: t('terms.changesTitle'),
      content: t('terms.changesText')
    }
  ];

  const lastUpdatedText = t('terms.lastUpdated', { date: 'January 15, 2024' });

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