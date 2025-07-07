
import { View } from 'react-native';
import { styles } from '../styles/OnboardingStyles';

interface OnboardingHeaderProps {
  onSkip: () => void;
}

export default function OnboardingHeader({ onSkip }: OnboardingHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Skip button removed */}
    </View>
  );
}
