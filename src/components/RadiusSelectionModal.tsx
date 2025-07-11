
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

interface RadiusSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  currentTheme: any;
  trackingRadius: number;
  onRadiusChange: (radius: number) => void;
}

export default function RadiusSelectionModal({
  visible,
  onClose,
  currentTheme,
  trackingRadius,
  onRadiusChange,
}: RadiusSelectionModalProps) {
  const { t } = useTranslation();

  const radiusOptions = [0.1, 0.5, 1]; // 100m, 500m, 1km

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
          <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{t('settings.trackingRadius')}</Text>
          <View style={modalStyles.modalHeaderButton} />
        </View>

        <View style={modalStyles.radiusOptionsContainer}>
          <Text style={[modalStyles.radiusDescription, { color: currentTheme.textSecondary }]}>
            {t('settings.chooseConnectDistance')}
          </Text>

          {radiusOptions.map((radius) => (
            <TouchableOpacity
              key={radius}
              style={[
                modalStyles.radiusOption,
                {
                  backgroundColor: trackingRadius === radius ? `${COLORS.primary}15` : currentTheme.surface,
                  borderColor: trackingRadius === radius ? COLORS.primary : currentTheme.border,
                  borderWidth: trackingRadius === radius ? 2 : 1,
                }
              ]}
              onPress={() => {
                onRadiusChange(radius);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <View style={modalStyles.radiusOptionContent}>
                <View style={modalStyles.radiusOptionLeft}>
                  <Text style={[
                    modalStyles.radiusOptionText,
                    {
                      color: trackingRadius === radius ? COLORS.primary : currentTheme.text,
                      fontFamily: 'System',
                      fontWeight: 'bold',
                    }
                  ]}>
                    {radius * 1000}m {t('settings.radius')}
                  </Text>
                  <Text style={[
                    modalStyles.radiusOptionDescription,
                    { color: currentTheme.textSecondary }
                  ]}>
                    {t('settings.connectWithin')} {radius * 1000} {t('settings.meters')}
                  </Text>
                </View>

                {trackingRadius === radius && (
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
