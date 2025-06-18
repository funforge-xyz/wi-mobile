
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../config/constants';
import { styles } from '../styles/HelpSupportStyles';
import HelpSupportContactOption from './HelpSupportContactOption';
import { handleEmailSupport, handleReportBug, handleFeatureRequest } from '../utils/helpSupportUtils';

interface HelpSupportContactModalProps {
  visible: boolean;
  onClose: () => void;
  currentTheme: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
}

export default function HelpSupportContactModal({
  visible,
  onClose,
  currentTheme,
}: HelpSupportContactModalProps) {
  const { t } = useTranslation();

  const handleEmailSupportPress = () => {
    handleEmailSupport();
    onClose();
  };

  const handleReportBugPress = () => {
    handleReportBug();
    onClose();
  };

  const handleFeatureRequestPress = () => {
    handleFeatureRequest();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>
              {t('helpSupport.cancel')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
            {t('helpSupport.contactSupportModal')}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.modalContent}>
          <Text style={[styles.modalDescription, { color: currentTheme.textSecondary }]}>
            {t('helpSupport.howWouldYouLike')}
          </Text>

          <HelpSupportContactOption
            iconName="mail"
            iconColor={COLORS.primary}
            title={t('helpSupport.emailSupport')}
            subtitle={t('helpSupport.getHelpViaEmail')}
            onPress={handleEmailSupportPress}
            currentTheme={currentTheme}
          />

          <HelpSupportContactOption
            iconName="bug"
            iconColor={COLORS.error}
            title={t('helpSupport.reportBugModal')}
            subtitle={t('helpSupport.reportTechnicalIssues')}
            onPress={handleReportBugPress}
            currentTheme={currentTheme}
          />

          <HelpSupportContactOption
            iconName="bulb"
            iconColor={COLORS.success}
            title={t('helpSupport.featureRequestModal')}
            subtitle={t('helpSupport.suggestNewFeatures')}
            onPress={handleFeatureRequestPress}
            currentTheme={currentTheme}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
