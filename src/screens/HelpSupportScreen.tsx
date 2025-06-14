import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../hooks/redux';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING } from '../config/constants';
interface HelpSupportScreenProps {
  navigation: any;
}

interface FAQItem {
  id: string;
  questionKey: string;
  answerKey: string;
}

export default function HelpSupportScreen({ navigation }: HelpSupportScreenProps) {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  const faqData: FAQItem[] = [
    {
      id: '1',
      questionKey: 'helpSupport.faqQuestions.howDoesMatchingWork',
      answerKey: 'helpSupport.faqQuestions.howDoesMatchingWorkAnswer',
    },
    {
      id: '2',
      questionKey: 'helpSupport.faqQuestions.howToConnect',
      answerKey: 'helpSupport.faqQuestions.howToConnectAnswer',
    },
    {
      id: '3',
      questionKey: 'helpSupport.faqQuestions.changeProfilePicture',
      answerKey: 'helpSupport.faqQuestions.changeProfilePictureAnswer',
    },
    {
      id: '4',
      questionKey: 'helpSupport.faqQuestions.deletePost',
      answerKey: 'helpSupport.faqQuestions.deletePostAnswer',
    },
    {
      id: '5',
      questionKey: 'helpSupport.faqQuestions.blockOrReport',
      answerKey: 'helpSupport.faqQuestions.blockOrReportAnswer',
    },
    {
      id: '6',
      questionKey: 'helpSupport.faqQuestions.nearbyFeature',
      answerKey: 'helpSupport.faqQuestions.nearbyFeatureAnswer',
    },
    {
      id: '7',
      questionKey: 'helpSupport.faqQuestions.changePassword',
      answerKey: 'helpSupport.faqQuestions.changePasswordAnswer',
    },
    {
      id: '8',
      questionKey: 'helpSupport.faqQuestions.deleteAccount',
      answerKey: 'helpSupport.faqQuestions.deleteAccountAnswer',
    },
    {
      id: '9',
      questionKey: 'helpSupport.faqQuestions.notReceivingNotifications',
      answerKey: 'helpSupport.faqQuestions.notReceivingNotificationsAnswer',
    },
  ];

  const handleFAQPress = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleContactSupport = () => {
    setContactModalVisible(true);
  };

  const handleEmailSupport = () => {
    const email = 'support@wichat.app';
    const subject = 'Help Request';
    const body = 'Please describe your issue here...';

    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`)
      .catch(() => {
        Alert.alert('Error', 'Unable to open email app. Please contact support@wichat.app directly.');
      });

    setContactModalVisible(false);
  };

  const handleReportBug = () => {
    const email = 'bugs@wichat.app';
    const subject = 'Bug Report';
    const body = 'Please describe the bug you encountered, including steps to reproduce it...';

    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`)
      .catch(() => {
        Alert.alert('Error', 'Unable to open email app. Please contact bugs@wichat.app directly.');
      });

    setContactModalVisible(false);
  };

  const handleFeatureRequest = () => {
    const email = 'features@wichat.app';
    const subject = 'Feature Request';
    const body = 'Please describe the feature you would like to see added...';

    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`)
      .catch(() => {
        Alert.alert('Error', 'Unable to open email app. Please contact features@wichat.app directly.');
      });

    setContactModalVisible(false);
  };

  const handlePrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  const handleTermsOfService = () => {
    navigation.navigate('Terms');
  };

  return (
   <>
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.background }]} showsVerticalScrollIndicator={false}>
      <SafeAreaView>
        <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{t('helpSupport.title')}</Text>
          <View style={{ width: 24 }} />
        </View>
        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('helpSupport.quickActions')}</Text>

          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: currentTheme.border }]}
            onPress={handleContactSupport}
          >
            <Ionicons name="mail-outline" size={20} color={currentTheme.text} />
            <Text style={[styles.actionText, { color: currentTheme.text }]}>{t('helpSupport.contactSupport')}</Text>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: currentTheme.border }]}
            onPress={handleReportBug}
          >
            <Ionicons name="bug-outline" size={20} color={currentTheme.text} />
            <Text style={[styles.actionText, { color: currentTheme.text }]}>{t('helpSupport.reportaBug')}</Text>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: 'transparent' }]}
            onPress={handleFeatureRequest}
          >
            <Ionicons name="bulb-outline" size={20} color={currentTheme.text} />
            <Text style={[styles.actionText, { color: currentTheme.text }]}>{t('helpSupport.requestFeature')}</Text>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('helpSupport.frequentlyAskedQuestions')}</Text>

          {faqData.map((faq, index) => (
            <View key={faq.id}>
              <TouchableOpacity 
                style={[styles.faqItem, { borderBottomColor: currentTheme.border }]}
                onPress={() => handleFAQPress(faq.id)}
              >
                <Text style={[styles.faqQuestion, { color: currentTheme.text }]}>
                  {t(faq.questionKey)}
                </Text>
                <Ionicons 
                  name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={currentTheme.textSecondary} 
                />
              </TouchableOpacity>

              {expandedFAQ === faq.id && (
                <View style={[styles.faqAnswer, { backgroundColor: currentTheme.background }]}>
                  <Text style={[styles.faqAnswerText, { color: currentTheme.textSecondary }]}>
                    {t(faq.answerKey)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* App Information */}
        <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('helpSupport.appInformation')}</Text>

          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: currentTheme.border }]}
            onPress={handlePrivacyPolicy}
          >
            <Ionicons name="shield-outline" size={20} color={currentTheme.text} />
            <Text style={[styles.actionText, { color: currentTheme.text }]}>{t('helpSupport.privacyPolicy')}</Text>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: currentTheme.border }]}
            onPress={handleTermsOfService}
          >
            <Ionicons name="document-text-outline" size={20} color={currentTheme.text} />
            <Text style={[styles.actionText, { color: currentTheme.text }]}>{t('helpSupport.termsOfService')}</Text>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.actionItem, { borderBottomColor: 'transparent' }]}>
            <Ionicons name="information-circle-outline" size={20} color={currentTheme.text} />
            <Text style={[styles.actionText, { color: currentTheme.text }]}>{t('helpSupport.appVersion')}</Text>
            <Text style={[styles.versionText, { color: currentTheme.textSecondary }]}>1.0.0</Text>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>

    {/* Contact Options Modal */}
    <Modal visible={contactModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
            <TouchableOpacity onPress={() => setContactModalVisible(false)}>
              <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>{t('helpSupport.cancel')}</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{t('helpSupport.contactSupportModal')}</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.modalDescription, { color: currentTheme.textSecondary }]}>
              {t('helpSupport.howWouldYouLike')}
            </Text>

            <TouchableOpacity 
              style={[styles.contactOption, { backgroundColor: currentTheme.surface }]}
              onPress={handleEmailSupport}
            >
              <Ionicons name="mail" size={24} color={COLORS.primary} />
              <View style={styles.contactOptionText}>
                <Text style={[styles.contactOptionTitle, { color: currentTheme.text }]}>{t('helpSupport.emailSupport')}</Text>
                <Text style={[styles.contactOptionSubtitle, { color: currentTheme.textSecondary }]}>
                  {t('helpSupport.getHelpViaEmail')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.contactOption, { backgroundColor: currentTheme.surface }]}
              onPress={handleReportBug}
            >
              <Ionicons name="bug" size={24} color={COLORS.error} />
              <View style={styles.contactOptionText}>
                <Text style={[styles.contactOptionTitle, { color: currentTheme.text }]}>{t('helpSupport.reportBugModal')}</Text>
                <Text style={[styles.contactOptionSubtitle, { color: currentTheme.textSecondary }]}>
                  {t('helpSupport.reportTechnicalIssues')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.contactOption, { backgroundColor: currentTheme.surface }]}
              onPress={handleFeatureRequest}
            >
              <Ionicons name="bulb" size={24} color={COLORS.success} />
              <View style={styles.contactOptionText}>
                <Text style={[styles.contactOptionTitle, { color: currentTheme.text }]}>{t('helpSupport.featureRequestModal')}</Text>
                <Text style={[styles.contactOptionSubtitle, { color: currentTheme.textSecondary }]}>
                  {t('helpSupport.suggestNewFeatures')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
   </>
  );
}

const lightTheme = {
  background: COLORS.background,
  surface: COLORS.surface,
  text: COLORS.text,
  textSecondary: COLORS.textSecondary,
  border: COLORS.border,
};

const darkTheme = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },

  section: {
    margin: SPACING.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.md,
  },
  versionText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  faqAnswer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  faqAnswerText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.md,
  },
  modalDescription: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  contactOptionText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  contactOptionTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  contactOptionSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
});