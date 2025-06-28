
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/LoginStyles';
import { COLORS } from '../config/constants';

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

  return (
    <View style={styles.termsContainer}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => setAcceptTerms(!acceptTerms)}
      >
        {acceptTerms && (
          <Ionicons name="checkmark" size={16} color={COLORS.primary} />
        )}
      </TouchableOpacity>
      <Text style={styles.termsText}>
        {t('auth.acceptTerms')}{' '}
        <Text style={styles.termsLink} onPress={onTermsPress}>
          {t('common.terms')}
        </Text>
      </Text>
    </View>
  );
}

interface LoginTermsCheckboxProps {
  acceptTerms: boolean;
  setAcceptTerms: (accept: boolean) => void;
  onTermsPress: () => void;
}

export default function LoginTermsCheckbox({ 
  acceptTerms, 
  setAcceptTerms, 
  onTermsPress 
}: LoginTermsCheckboxProps) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity 
      style={styles.termsContainer} 
      onPress={() => setAcceptTerms(!acceptTerms)}
    >
      <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
        {acceptTerms && <Ionicons name="checkmark" size={16} color="white" />}
      </View>
      <Text style={styles.termsText}>
        I accept the{' '}
        <Text 
          style={styles.termsLink}
          onPress={onTermsPress}
        >
          {t('common.terms')}
        </Text>
      </Text>
    </TouchableOpacity>
  );
}
