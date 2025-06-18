
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../config/constants';
import { styles, modalStyles } from '../styles/SettingsStyles';

interface PushNotificationModalProps {
  visible: boolean;
  onClose: () => void;
  currentTheme: any;
  isLoading?: boolean;
}

export default function PushNotificationModal({
  visible,
  onClose,
  currentTheme,
  isLoading = false,
}: PushNotificationModalProps) {
  const { t } = useTranslation();

  const handleOpenSettings = () => {
    onClose();
    Linking.openSettings();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.modalCancel, { color: currentTheme.textSecondary }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
            {t('settings.permissionRequired')}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={modalStyles.warningSection}>
            <View style={[modalStyles.warningIconContainer, { backgroundColor: `${COLORS.primary}15` }]}>
              <Ionicons name="notifications-outline" size={48} color={COLORS.primary} />
            </View>
            <Text style={[modalStyles.warningTitle, { color: currentTheme.text }]}>
              {t('settings.notificationPermissionTitle')}
            </Text>
            <Text style={[modalStyles.warningText, { color: currentTheme.textSecondary }]}>
              {t('settings.notificationPermissionDescription')}
            </Text>

            <View style={[modalStyles.listContainer, { backgroundColor: currentTheme.surface }]}>
              <View style={modalStyles.listItem}>
                <Ionicons name="chatbubbles-outline" size={16} color={currentTheme.textSecondary} />
                <Text style={[modalStyles.listItemText, { color: currentTheme.textSecondary }]}>
                  {t('settings.newMessageNotifications')}
                </Text>
              </View>
              <View style={modalStyles.listItem}>
                <Ionicons name="heart-outline" size={16} color={currentTheme.textSecondary} />
                <Text style={[modalStyles.listItemText, { color: currentTheme.textSecondary }]}>
                  {t('settings.likeNotifications')}
                </Text>
              </View>
              <View style={modalStyles.listItem}>
                <Ionicons name="chatbox-outline" size={16} color={currentTheme.textSecondary} />
                <Text style={[modalStyles.listItemText, { color: currentTheme.textSecondary }]}>
                  {t('settings.commentNotifications')}
                </Text>
              </View>
              <View style={[modalStyles.listItem, { borderBottomWidth: 0 }]}>
                <Ionicons name="people-outline" size={16} color={currentTheme.textSecondary} />
                <Text style={[modalStyles.listItemText, { color: currentTheme.textSecondary }]}>
                  {t('settings.connectionNotifications')}
                </Text>
              </View>
            </View>

            <View style={[modalStyles.cautionBox, { backgroundColor: `${COLORS.primary}08`, borderColor: `${COLORS.primary}40` }]}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
              <Text style={[modalStyles.cautionText, { color: currentTheme.text }]}>
                {t('settings.enableNotificationsInDeviceSettings')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[modalStyles.deleteButton, { backgroundColor: COLORS.primary, opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleOpenSettings}
            disabled={isLoading}
          >
            <Ionicons name="settings-outline" size={20} color="white" />
            <Text style={modalStyles.deleteButtonText}>
              {t('settings.openSettings')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
