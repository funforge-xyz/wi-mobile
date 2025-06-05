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

export default function TermsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Terms and Conditions</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.sectionText}>
          By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.
        </Text>

        <Text style={styles.sectionTitle}>2. Privacy Policy</Text>
        <Text style={styles.sectionText}>
          Your privacy is important to us. We collect and use your information in accordance with our Privacy Policy, which is incorporated into these Terms by reference.
        </Text>

        <Text style={styles.sectionTitle}>3. User Conduct</Text>
        <Text style={styles.sectionText}>
          You agree to use the application in a manner consistent with any and all applicable laws and regulations. You may not use the application for any unlawful purpose or any purpose prohibited under this clause.
        </Text>

        <Text style={styles.sectionTitle}>4. Content Guidelines</Text>
        <Text style={styles.sectionText}>
          Users are responsible for the content they post. Content must not be offensive, illegal, or violate any third-party rights. We reserve the right to remove any content that violates these guidelines.
        </Text>

        <Text style={styles.sectionTitle}>5. Account Security</Text>
        <Text style={styles.sectionText}>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
        </Text>

        <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
        <Text style={styles.sectionText}>
          The application is provided "as is" without any representations or warranties. We shall not be liable for any damages arising from the use of this application.
        </Text>

        <Text style={styles.sectionTitle}>7. Changes to Terms</Text>
        <Text style={styles.sectionText}>
          We reserve the right to modify these terms at any time. Users will be notified of any significant changes.
        </Text>

        <Text style={styles.lastUpdated}>
          Last Updated: {new Date().toLocaleDateString()}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  lastUpdated: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
    fontStyle: 'italic',
  },
});