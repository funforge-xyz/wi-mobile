
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { COLORS } from '../config/constants';
import { styles, modalStyles } from '../styles/SettingsStyles';
import { locationService } from '../services/locationService';

interface LocationPermissionModalProps {
  visible: boolean;
  onPermissionGranted: () => void;
  currentTheme: any;
}

export default function LocationPermissionModal({
  visible,
  onPermissionGranted,
  currentTheme,
}: LocationPermissionModalProps) {
  const { t } = useTranslation();
  const [isChecking, setIsChecking] = useState(false);

  const checkPermissions = async () => {
    setIsChecking(true);
    try {
      const hasPermissions = await locationService.checkPermissions();
      if (hasPermissions) {
        // Start tracking and close modal
        await locationService.startLocationTracking();
        onPermissionGranted();
      } else {
        Alert.alert(
          t('location.permissionRequired'),
          t('location.pleaseEnableInSettings'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      console.error('Error checking location permissions:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRequestPermissions = async () => {
    setIsChecking(true);
    try {
      const granted = await locationService.requestPermissions();
      if (granted) {
        await locationService.startLocationTracking();
        onPermissionGranted();
      } else {
        Alert.alert(
          t('location.permissionDenied'),
          t('location.openSettingsToEnable'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('settings.openSettings'), onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      Alert.alert(
        t('common.error'),
        t('location.errorRequestingPermissions'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
          <View style={{ width: 60 }} />
          <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
            {t('location.permissionRequired')}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={modalStyles.warningSection}>
            <View style={[modalStyles.warningIconContainer, { backgroundColor: `${COLORS.primary}15` }]}>
              <Ionicons name="location-outline" size={48} color={COLORS.primary} />
            </View>
            <Text style={[modalStyles.warningTitle, { color: currentTheme.text }]}>
              {t('location.locationRequired')}
            </Text>
            <Text style={[modalStyles.warningText, { color: currentTheme.textSecondary }]}>
              {t('location.locationRequiredDescription')}
            </Text>

            <View style={[modalStyles.listContainer, { backgroundColor: currentTheme.surface }]}>
              <View style={modalStyles.listItem}>
                <Ionicons name="people-outline" size={16} color={currentTheme.textSecondary} />
                <Text style={[modalStyles.listItemText, { color: currentTheme.textSecondary }]}>
                  {t('location.findNearbyUsers')}
                </Text>
              </View>
              <View style={modalStyles.listItem}>
                <Ionicons name="location-outline" size={16} color={currentTheme.textSecondary} />
                <Text style={[modalStyles.listItemText, { color: currentTheme.textSecondary }]}>
                  {t('location.shareYourLocation')}
                </Text>
              </View>
              <View style={[modalStyles.listItem, { borderBottomWidth: 0 }]}>
                <Ionicons name="wifi-outline" size={16} color={currentTheme.textSecondary} />
                <Text style={[modalStyles.listItemText, { color: currentTheme.textSecondary }]}>
                  {t('location.networkBasedMatching')}
                </Text>
              </View>
            </View>

            <View style={[modalStyles.cautionBox, { backgroundColor: `${COLORS.error}08`, borderColor: `${COLORS.error}40` }]}>
              <Ionicons name="warning-outline" size={20} color={COLORS.error} />
              <Text style={[modalStyles.cautionText, { color: currentTheme.text }]}>
                {t('location.locationRequiredToUseApp')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[modalStyles.deleteButton, { backgroundColor: COLORS.primary, opacity: isChecking ? 0.7 : 1 }]}
            onPress={handleRequestPermissions}
            disabled={isChecking}
          >
            <Ionicons name="location-outline" size={20} color="white" />
            <Text style={modalStyles.deleteButtonText}>
              {isChecking ? t('location.checkingPermissions') : t('location.enableLocation')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[modalStyles.secondaryButton, { borderColor: currentTheme.border, opacity: isChecking ? 0.7 : 1 }]}
            onPress={checkPermissions}
            disabled={isChecking}
          >
            <Ionicons name="refresh-outline" size={20} color={currentTheme.text} />
            <Text style={[modalStyles.secondaryButtonText, { color: currentTheme.text }]}>
              {t('location.checkAgain')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
