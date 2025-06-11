
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector } from '../hooks/redux';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.text }]}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>1. Information We Collect</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          We collect information you provide directly to us, such as when you create an account, post content, send messages, or contact us for support. This includes your name, email address, profile information, posts, messages, and any other information you choose to provide.
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>2. Location Information</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          With your permission, we collect and process information about your precise or approximate location to provide location-based features such as finding nearby users and posts. You can control location sharing through your device settings.
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>3. How We Use Your Information</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          We use the information we collect to provide, maintain, and improve our services, including to facilitate connections between users, personalize your experience, send you notifications, respond to your requests, and ensure the security of our platform.
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>4. Information Sharing</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share information with service providers who assist us in operating our platform, conducting business, or serving users.
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>5. Data Security</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>6. Data Retention</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          We retain your information for as long as your account is active or as needed to provide you services. You may delete your account at any time, which will remove your personal information from our active databases.
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>7. Children's Privacy</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will delete that information.
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>8. Your Rights</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          You have the right to access, update, or delete your personal information. You can manage most of this information through your account settings. For additional requests, please contact us through the support channels in the app.
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>9. Changes to This Policy</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          We may update this privacy policy from time to time. We will notify you of any significant changes by posting the new policy in the app and updating the "Last Updated" date below.
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>10. Contact Us</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          If you have any questions about this privacy policy, please contact us through the Help & Support section in the app or email us at privacy@wichat.app.
        </Text>

        <Text style={[styles.lastUpdated, { color: currentTheme.textSecondary }]}>
          Last Updated: {new Date().toLocaleDateString()}
        </Text>
      </ScrollView>
    </SafeAreaView>
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
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  lastUpdated: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
    fontStyle: 'italic',
  },
});
