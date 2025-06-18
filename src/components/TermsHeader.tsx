
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

interface TermsHeaderProps {
  currentTheme: any;
  styles: any;
}

export default function TermsHeader({ currentTheme, styles }: TermsHeaderProps) {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: currentTheme.text }]}>{t('terms.title')}</Text>
    </View>
  );
}
