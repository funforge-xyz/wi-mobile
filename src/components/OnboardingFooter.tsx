
import { View, TouchableOpacity, Text } from 'react-native';
import { styles } from '../styles/OnboardingStyles';

interface OnboardingFooterProps {
  buttonText: string;
  onNext: () => void;
}

export default function OnboardingFooter({ buttonText, onNext }: OnboardingFooterProps) {
  return (
    <View style={styles.footer}>
      <TouchableOpacity
        style={styles.nextButton}
        onPress={onNext}
      >
        <Text style={styles.nextButtonText}>
          {buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
