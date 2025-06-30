import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../hooks/redux';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../config/constants';
import { styles } from '../styles/HelpSupportStyles';
import { faqData, handleReportBug, handleFeatureRequest } from '../utils/helpSupportUtils';
import HelpSupportActionItem from '../components/HelpSupportActionItem';
import HelpSupportFAQItem from '../components/HelpSupportFAQItem';
import HelpSupportContactModal from '../components/HelpSupportContactModal';
import { getTheme } from '../theme';

interface HelpSupportScreenProps {
  navigation: any;
}



export default function HelpSupportScreen({ navigation }: HelpSupportScreenProps) {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const currentTheme = getTheme(isDarkMode);

  const handleFAQPress = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleContactSupport = () => {
    setContactModalVisible(true);
  };

  const handlePrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  const handleTermsOfService = () => {
    navigation.navigate('Terms');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{t('helpSupport.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* Quick Actions */}
          <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('helpSupport.quickActions')}</Text>

            <HelpSupportActionItem
              iconName="mail-outline"
              text={t('helpSupport.contactSupport')}
              onPress={handleContactSupport}
              currentTheme={currentTheme}
            />

            <HelpSupportActionItem
              iconName="bug-outline"
              text={t('helpSupport.reportaBug')}
              onPress={handleReportBug}
              currentTheme={currentTheme}
            />

            <HelpSupportActionItem
              iconName="bulb-outline"
              text={t('helpSupport.requestFeature')}
              onPress={handleFeatureRequest}
              currentTheme={currentTheme}
              isLast={true}
            />
          </View>

          {/* FAQ Section */}
          <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('helpSupport.frequentlyAskedQuestions')}</Text>

            {faqData.map((faq) => (
              <HelpSupportFAQItem
                key={faq.id}
                faq={faq}
                isExpanded={expandedFAQ === faq.id}
                onPress={() => handleFAQPress(faq.id)}
                currentTheme={currentTheme}
              />
            ))}
          </View>

          {/* App Information */}
          <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('helpSupport.appInformation')}</Text>

            <HelpSupportActionItem
              iconName="shield-outline"
              text={t('helpSupport.privacyPolicy')}
              onPress={handlePrivacyPolicy}
              currentTheme={currentTheme}
            />

            <HelpSupportActionItem
              iconName="document-text-outline"
              text={t('helpSupport.termsOfService')}
              onPress={handleTermsOfService}
              currentTheme={currentTheme}
            />

            <HelpSupportActionItem
              iconName="information-circle-outline"
              text={t('helpSupport.appVersion')}
              onPress={() => {}}
              showChevron={false}
              rightText="1.0.0"
              currentTheme={currentTheme}
              isLast={true}
            />
          </View>
      </ScrollView>

      <HelpSupportContactModal
        visible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
        currentTheme={currentTheme}
      />
    </SafeAreaView>
  );
}