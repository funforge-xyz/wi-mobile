
import { Text } from 'react-native';
import { styles } from '../styles/PrivacyPolicyStyles';

interface PolicyFooterProps {
  lastUpdatedText: string;
  currentTheme: any;
}

export default function PolicyFooter({ lastUpdatedText, currentTheme }: PolicyFooterProps) {
  return (
    <Text style={[styles.lastUpdated, { color: currentTheme.textSecondary }]}>
      {lastUpdatedText}
    </Text>
  );
}
