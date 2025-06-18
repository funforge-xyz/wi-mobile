
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/LoginStyles';

interface LoginHeaderProps {
  isSignUp: boolean;
}

export default function LoginHeader({ isSignUp }: LoginHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <Text style={styles.title}>
        {isSignUp ? t('auth.createAccount') : t('auth.welcome')}
      </Text>
      <Text style={styles.subtitle}>
        {isSignUp ? t('auth.getStarted') : 'Sign in to continue'}
      </Text>
    </View>
  );
}
