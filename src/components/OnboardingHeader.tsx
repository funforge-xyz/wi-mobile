
import { View, TouchableOpacity, Text } from 'react-native';
import { styles } from '../styles/OnboardingStyles';

interface OnboardingHeaderProps {
  onSkip: () => void;
}

export default function OnboardingHeader({ onSkip }: OnboardingHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onSkip}>
        <Text style={styles.skipButton}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}
