
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/redux';
import { getTheme } from '../theme';
import { authService } from '../services/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const colors = getTheme(isDarkMode);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleDeletePress = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);

    try {
      await authService.deleteProfile();
      setIsLoading(false);
      setShowSuccess(true);
      
      // Close the success modal after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    } catch (error: any) {
      setIsLoading(false);
      console.error('Delete account error:', error);
      
      if (error.message.includes('recent login')) {
        Alert.alert(
          t('settings.deleteAccount'),
          'For security reasons, please sign out and sign back in before deleting your account.',
          [{ text: t('common.ok') }]
        );
      } else {
        Alert.alert(
          t('common.error'),
          'Failed to delete account. Please try again.',
          [{ text: t('common.ok') }]
        );
      }
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
  };

  const handleClose = () => {
    if (!isLoading && !showSuccess) {
      onClose();
    }
  };

  return (
    <>
      {/* Main Delete Account Modal */}
      <Modal
        visible={visible && !showConfirmModal && !isLoading && !showSuccess}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 24,
            margin: 20,
            maxWidth: 340,
            width: '100%',
          }}>
            <View style={{
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#FF4444',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <Icon name="warning" size={30} color="#FFFFFF" />
              </View>
              <Text style={{
                fontSize: 20,
                fontWeight: '600',
                color: colors.text,
                marginBottom: 8,
                textAlign: 'center',
              }}>
                {t('settings.deleteAccount')}
              </Text>
              <Text style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: 'center',
                lineHeight: 20,
              }}>
                This action will permanently delete your account and all associated data. This cannot be undone.
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              gap: 12,
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: colors.border,
                  alignItems: 'center',
                }}
                onPress={handleClose}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: colors.text,
                }}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: '#FF4444',
                  alignItems: 'center',
                }}
                onPress={handleDeletePress}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: '#FFFFFF',
                }}>
                  {t('common.delete')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelConfirm}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 24,
            margin: 20,
            maxWidth: 340,
            width: '100%',
          }}>
            <View style={{
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#FF4444',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <Icon name="delete-forever" size={30} color="#FFFFFF" />
              </View>
              <Text style={{
                fontSize: 20,
                fontWeight: '600',
                color: colors.text,
                marginBottom: 8,
                textAlign: 'center',
              }}>
                Confirm Deletion
              </Text>
              <Text style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: 'center',
                lineHeight: 20,
              }}>
                Are you absolutely sure you want to delete your account? This will remove all your posts, connections, and data permanently.
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              gap: 12,
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: colors.border,
                  alignItems: 'center',
                }}
                onPress={handleCancelConfirm}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: colors.text,
                }}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: '#FF4444',
                  alignItems: 'center',
                }}
                onPress={handleConfirmDelete}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: '#FFFFFF',
                }}>
                  Yes, Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Modal */}
      <Modal
        visible={isLoading}
        transparent
        animationType="fade"
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 32,
            alignItems: 'center',
            minWidth: 200,
          }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{
              fontSize: 16,
              fontWeight: '500',
              color: colors.text,
              marginTop: 16,
              textAlign: 'center',
            }}>
              Deleting Account...
            </Text>
            <Text style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginTop: 8,
              textAlign: 'center',
            }}>
              Please wait while we delete your account and all associated data.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 32,
            alignItems: 'center',
            minWidth: 200,
          }}>
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: '#4CAF50',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <Icon name="check" size={30} color="#FFFFFF" />
            </View>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 8,
              textAlign: 'center',
            }}>
              Account Deleted
            </Text>
            <Text style={{
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: 'center',
            }}>
              Your account has been permanently deleted.
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default DeleteAccountModal;
