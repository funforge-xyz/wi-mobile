import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/redux';
import { getTheme } from '../theme';

interface LocationPermissionModalProps {
  isVisible: boolean;
  onRequestPermission: () => void;
  onCancel?: () => void;
  permissionDenied?: boolean;
  hasTriedRequest?: boolean;
}

const LocationPermissionModal: React.FC<LocationPermissionModalProps> = (props) => {
  const {
    isVisible,
    onRequestPermission,
    onCancel,
    permissionDenied = false,
    hasTriedRequest = false,
  } = props;
  const { t } = useTranslation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const currentTheme = getTheme(isDarkMode);

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
      }}>
        <View style={{
          backgroundColor: currentTheme.surface,
          borderRadius: 12,
          padding: 24,
          width: '100%',
          maxWidth: 400,
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '600',
            color: currentTheme.text,
            textAlign: 'center',
            marginBottom: 16,
          }}>
            {permissionDenied ? t('location.permissionDenied') : t('location.permissionRequired')}
          </Text>

          <Text style={{
            fontSize: 16,
            color: currentTheme.textSecondary,
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 22,
          }}>
            {permissionDenied 
              ? t('location.permissionDeniedDescription') 
              : t('location.permissionDescription')
            }
          </Text>

          <View style={{ gap: 12 }}>
            {!permissionDenied && (
              <TouchableOpacity
                style={{
                  backgroundColor: currentTheme.primary,
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={onRequestPermission}
              >
                <Text style={{
                  color: currentTheme.background,
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  {t('location.grantPermission')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={{
                backgroundColor: currentTheme.border,
                paddingVertical: 14,
                paddingHorizontal: 24,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={handleOpenSettings}
            >
              <Text style={{
                color: currentTheme.text,
                fontSize: 16,
                fontWeight: '500',
              }}>
                {t('common.openSettings')}
              </Text>
            </TouchableOpacity>

            {onCancel && (
              <TouchableOpacity
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                  alignItems: 'center',
                }}
                onPress={onCancel}
              >
                <Text style={{
                  color: currentTheme.textSecondary,
                  fontSize: 16,
                  fontWeight: '500',
                }}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LocationPermissionModal;