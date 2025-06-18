
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/LoginStyles';

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
