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
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How does matching work?',
    answer: 'Matching works based on your location radius and WiFi connection. You will see users who are within your set location radius or connected to the same WiFi network as you. This helps you discover people nearby for meaningful connections.',
  },
  {
    id: '2',
    question: 'How do I connect with other users?',
    answer: 'You can connect with users by going to the Nearby tab, tapping on people you want to connect with, and sending them the first message. This will send a connection request. You can also visit their profiles and tap "Connect", or find users by searching.',
  },
  {
    id: '3',
    question: 'How do I change my profile picture?',
    answer: 'Go to Settings > Edit Profile, then tap on your current profile picture to change it. You can take a new photo or choose from your photo library.',
  },
  {
    id: '4',
    question: 'How do I delete a post?',
    answer: 'Tap on one of your posts, then tap the three dots menu in the top right corner and select "Delete Post".',
  },
  {
    id: '5',
    question: 'How do I block or report someone?',
    answer: 'Go to their profile, tap the three dots menu, and select either "Block User" or "Report User". You can also report individual posts by tapping the three dots on any post.',
  },
  {
    id: '6',
    question: 'How does the Nearby feature work?',
    answer: 'The Nearby feature shows posts and people near your current location. Make sure location permissions are enabled for the app to use this feature.',
  },
  {
    id: '7',
    question: 'How do I change my password?',
    answer: 'Go to Settings > Change Password and follow the prompts to update your password.',
  },
  {
    id: '8',
    question: 'How do I delete my account?',
    answer: 'Go to Settings > Delete Profile. This action is permanent and cannot be undone.',
  },
  {
    id: '9',
    question: 'Why am I not receiving notifications?',
    answer: 'Check your device settings to make sure notifications are enabled for this app. You can also check notification settings within the app.',
  },
];

export default function HelpSupportScreen({ navigation }: HelpSupportScreenProps) {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

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
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Quick Actions</Text>

          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: currentTheme.border }]}
            onPress={handleContactSupport}
          >
            <Ionicons name="mail-outline" size={20} color={currentTheme.text} />
            <Text style={[styles.actionText, { color: currentTheme.text }]}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: currentTheme.border }]}
            onPress={handleReportBug}
          >
            <Ionicons name="bug-outline" size={20} color={currentTheme.text} />
            <Text style={[styles.actionText, { color: currentTheme.text }]}>Report a Bug</Text>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: 'transparent' }]}
            onPress={handleFeatureRequest}
          >
            <Ionicons name="bulb-outline" size={20} color={currentTheme.text} />
            <Text style={[styles.actionText, { color: currentTheme.text }]}>Request Feature</Text>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Frequently Asked Questions</Text>

          {faqData.map((faq, index) => (
            <View key={faq.id}>
              <TouchableOpacity 
                style={[styles.faqItem, { borderBottomColor: currentTheme.border }]}
                onPress={() => handleFAQPress(faq.id)}
              >
                <Text style={[styles.faqQuestion, { color: currentTheme.text }]}>
                  {faq.question}
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
                    {faq.answer}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* App Information */}
        <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>App Information</Text>

          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: currentTheme.border }]}
            onPress={handlePrivacyPolicy}
          >
            <Ionicons name="shield-outline" size={20} color={currentTheme.text} />
            <Text style={[styles.actionText, { color: currentTheme.text }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: currentTheme.border }]}
            onPress={handleTermsOfService}
          >
            <Ionicons name="document-text-outline" size={20} color={currentTheme.text} />
            <Text style={[styles.actionText, { color: currentTheme.text }]}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.actionItem, { borderBottomColor: 'transparent' }]}>
            <Ionicons name="information-circle-outline" size={20} color={currentTheme.text} />
            <Text style={[styles.actionText, { color: currentTheme.text }]}>App Version</Text>
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
              <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Contact Support</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.modalDescription, { color: currentTheme.textSecondary }]}>
              How would you like to contact our support team?
            </Text>

            <TouchableOpacity 
              style={[styles.contactOption, { backgroundColor: currentTheme.surface }]}
              onPress={handleEmailSupport}
            >
              <Ionicons name="mail" size={24} color={COLORS.primary} />
              <View style={styles.contactOptionText}>
                <Text style={[styles.contactOptionTitle, { color: currentTheme.text }]}>Email Support</Text>
                <Text style={[styles.contactOptionSubtitle, { color: currentTheme.textSecondary }]}>
                  Get help via email
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.contactOption, { backgroundColor: currentTheme.surface }]}
              onPress={handleReportBug}
            >
              <Ionicons name="bug" size={24} color={COLORS.error} />
              <View style={styles.contactOptionText}>
                <Text style={[styles.contactOptionTitle, { color: currentTheme.text }]}>Report Bug</Text>
                <Text style={[styles.contactOptionSubtitle, { color: currentTheme.textSecondary }]}>
                  Report technical issues
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.contactOption, { backgroundColor: currentTheme.surface }]}
              onPress={handleFeatureRequest}
            >
              <Ionicons name="bulb" size={24} color={COLORS.success} />
              <View style={styles.contactOptionText}>
                <Text style={[styles.contactOptionTitle, { color: currentTheme.text }]}>Feature Request</Text>
                <Text style={[styles.contactOptionSubtitle, { color: currentTheme.textSecondary }]}>
                  Suggest new features
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