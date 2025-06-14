
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
import { useTranslation } from 'react-i18next';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

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
        <Text style={[styles.title, { color: currentTheme.text }]}>{t('privacy.title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('privacy.infoCollectTitle')}</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          {t('privacy.infoCollectText')}
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('privacy.locationTitle')}</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          {t('privacy.locationText')}
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('privacy.howWeUseTitle')}</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          {t('privacy.howWeUseText')}
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('privacy.sharingTitle')}</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          {t('privacy.sharingText')}
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('privacy.securityTitle')}</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          {t('privacy.securityText')}
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('privacy.retentionTitle')}</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          {t('privacy.retentionText')}
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('privacy.childrenTitle')}</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          {t('privacy.childrenText')}
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('privacy.rightsTitle')}</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          {t('privacy.rightsText')}
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('privacy.changesTitle')}</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          {t('privacy.changesText')}
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{t('privacy.contactTitle')}</Text>
        <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
          {t('privacy.contactText')}
        </Text>

        <Text style={[styles.lastUpdated, { color: currentTheme.textSecondary }]}>
          {t('privacy.lastUpdated', { date: new Date().toLocaleDateString() })}
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
