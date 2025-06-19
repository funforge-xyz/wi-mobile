import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../hooks/redux';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/PrivacyPolicyStyles';
import { privacySections, getLastUpdatedText } from '../utils/privacyPolicyUtils';
import PolicyHeader from '../components/PolicyHeader';
import PolicySection from '../components/PolicySection';
import PolicyFooter from '../components/PolicyFooter';
import { getTheme } from '../theme';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const currentTheme = getTheme(isDarkMode);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <PolicyHeader
        title={t('privacy.title')}
        onBackPress={() => navigation.goBack()}
        currentTheme={currentTheme}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {privacySections.map((section, index) => (
          <PolicySection
            key={index}
            title={t(section.titleKey)}
            text={t(section.textKey)}
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