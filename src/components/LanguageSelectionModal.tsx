
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../config/constants';
import { styles, modalStyles } from '../styles/SettingsStyles';

interface LanguageSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  currentTheme: any;
  onLanguageChange: (code: string) => void;
  currentLanguage: string;
}

export default function LanguageSelectionModal({
  visible,
  onClose,
  currentTheme,
  onLanguageChange,
  currentLanguage,
}: LanguageSelectionModalProps) {
  const { t } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦' },
    { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷' },
    { code: 'sr', name: 'Serbian', nativeName: 'Srpski', flag: '🇷🇸' }
  ];

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity 
            onPress={onClose}
            style={modalStyles.modalHeaderButton}
          >
            <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{t('settings.changeLanguage')}</Text>
          <View style={modalStyles.modalHeaderButton} />
        </View>

        <View style={modalStyles.radiusOptionsContainer}>
          <Text style={[modalStyles.radiusDescription, { color: currentTheme.textSecondary }]}>
            {t('settings.selectPreferredLanguage')}
          </Text>

          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                modalStyles.radiusOption,
                {
                  backgroundColor: currentTheme.surface,
                  borderColor: currentLanguage === language.code ? COLORS.primary : currentTheme.border,
                  borderWidth: currentLanguage === language.code ? 2 : 1,
                }
              ]}
              onPress={() => onLanguageChange(language.code)}
              activeOpacity={0.7}
            >
              <View style={{...modalStyles.radiusOptionContent}}>
                <View style={modalStyles.radiusOptionLeft}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 24 }}>{language.flag}</Text>
                    <View>
                      <Text style={[
                        modalStyles.radiusOptionText,
                        {
                          color: currentLanguage === language.code ? COLORS.primary : currentTheme.text,
                          fontFamily: 'System',
                          fontWeight: 'bold',
                        }
                      ]}>
                        {language.nativeName}
                      </Text>
                      <Text style={[
                        modalStyles.radiusOptionDescription,
                        { color: currentTheme.textSecondary }
                      ]}>
                        {language.name}
                      </Text>
                    </View>
                  </View>
                </View>

                {currentLanguage === language.code && (
                  <View style={modalStyles.radiusSelectedIcon}>
                    <Ionicons name="checkmark-circle-outline" size={28} color={COLORS.primary} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
