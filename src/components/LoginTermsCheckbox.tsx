import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { createLoginStyles } from '../styles/LoginStyles';
import { useAppSelector } from '../hooks/redux';
import { getTheme } from '../theme';

interface LoginTermsCheckboxProps {
  acceptTerms: boolean;
  setAcceptTerms: (accept: boolean) => void;
  onTermsPress: () => void;
}

export default function LoginTermsCheckbox({
  acceptTerms,
  setAcceptTerms,
  onTermsPress,
}: LoginTermsCheckboxProps) {
  const { t } = useTranslation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const currentTheme = getTheme(isDarkMode);
  const styles = createLoginStyles(isDarkMode);

  return (
    <View style={styles.termsContainer}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => setAcceptTerms(!acceptTerms)}
      >
        {acceptTerms && (
          <Ionicons name="checkmark" size={16} color={currentTheme.primary} />
        )}
      </TouchableOpacity>
      <Text style={[styles.termsText, { color: currentTheme.text }]}>
        {t('auth.acceptTerms')}{' '}
        <Text style={[styles.termsLink, { color: currentTheme.primary }]} onPress={onTermsPress}>
          {t('common.terms')}
        </Text>
      </Text>
    </View>
  );
}