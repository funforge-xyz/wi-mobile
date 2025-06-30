import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../hooks/redux';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/TermsStyles';
import { getTermsSections, getLastUpdatedText } from '../utils/termsUtils';
import PolicySection from '../components/PolicySection';
import PolicyFooter from '../components/PolicyFooter';
import { getTheme } from '../theme';

export default function TermsScreen() {
  const navigation = useNavigation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();

  const currentTheme = getTheme(isDarkMode);
  const termsSections = getTermsSections(t);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{t('terms.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {termsSections.map((section, index) => (
          <PolicySection
            key={index}
            title={section.title}
            text={section.content}
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