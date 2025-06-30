import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../hooks/redux';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/PrivacyPolicyStyles';
import { privacySections, getLastUpdatedText } from '../utils/privacyPolicyUtils';
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
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{t('privacy.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

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