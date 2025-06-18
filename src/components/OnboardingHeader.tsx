
import { View, TouchableOpacity, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/OnboardingStyles';

interface OnboardingHeaderProps {
  onSkip: () => void;
}

export default function OnboardingHeader({ onSkip }: OnboardingHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onSkip}>
        <Text style={styles.skipButton}>{t('onboarding.skip')}</Text>
      </TouchableOpacity>
    </View>
  );
}
