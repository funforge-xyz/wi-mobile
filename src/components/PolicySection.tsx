
import { Text } from 'react-native';
import { styles } from '../styles/PrivacyPolicyStyles';

interface PolicySectionProps {
  title: string;
  text: string;
  currentTheme: any;
}

export default function PolicySection({ title, text, currentTheme }: PolicySectionProps) {
  return (
    <>
      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{title}</Text>
      <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
        {text}
      </Text>
    </>
  );
}
