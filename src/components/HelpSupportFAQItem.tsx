
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/HelpSupportStyles';
import type { FAQItem } from '../utils/helpSupportUtils';

interface HelpSupportFAQItemProps {
  faq: FAQItem;
  isExpanded: boolean;
  onPress: () => void;
  currentTheme: {
    text: string;
    textSecondary: string;
    border: string;
    background: string;
  };
}

export default function HelpSupportFAQItem({
  faq,
  isExpanded,
  onPress,
  currentTheme,
}: HelpSupportFAQItemProps) {
  const { t } = useTranslation();

  return (
    <View>
      <TouchableOpacity
        style={[styles.faqItem, { borderBottomColor: currentTheme.border }]}
        onPress={onPress}
      >
        <Text style={[styles.faqQuestion, { color: currentTheme.text }]}>
          {t(faq.questionKey)}
        </Text>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={currentTheme.textSecondary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={[styles.faqAnswer, { backgroundColor: currentTheme.background }]}>
          <Text style={[styles.faqAnswerText, { color: currentTheme.textSecondary }]}>
            {t(faq.answerKey)}
          </Text>
        </View>
      )}
    </View>
  );
}
