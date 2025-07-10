import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
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
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const colors = getTheme(isDarkMode);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);


  const handleDeletePress = () => {
    setPassword('');
    setPasswordError(null);
    setErrorMessage(null);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }

    // Clear previous errors
    setPasswordError(null);
    setErrorMessage(null);
    
    // Show loading in confirmation modal first
    setIsLoading(true);

    try {
      await authService.deleteProfileWithPassword(password);
      
      // After successful deletion, close confirmation modal and show success
      setIsLoading(false);
      setShowConfirmModal(false);
      setShowSuccess(true);

      // Close the success modal after 2 seconds and sign out
      setTimeout(async () => {
        setShowSuccess(false);
        try {
          // Use the same sign-out process as the profile sign-out button
          await authService.signOut();
        } catch (logoutError) {
          console.error('Logout error after account deletion:', logoutError);
          // Even if logout fails, the account is deleted, so callback should still trigger
        }
        onClose();
      }, 2000);
    } catch (error: any) {
      setIsLoading(false);
      console.error('Delete account error:', error);
      
      // Check for credential errors - keep modal open and show password error
      if (error.code === 'auth/invalid-credential' || 
          error.code === 'auth/wrong-password' ||
          error.message.includes('wrong-password') || 
          error.message.includes('invalid-credential')) {
        // Don't close the confirmation modal, just show the error
        setPasswordError('Incorrect password. Please try again.');
        setPassword(''); // Clear the password field
      } else if (error.message.includes('recent login')) {
        setShowConfirmModal(false);
        setErrorMessage('For security reasons, please sign out and sign back in before deleting your account.');
      } else {
        setShowConfirmModal(false);
        setErrorMessage('Failed to delete account. Please try again.');
      }
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setPassword('');
    setPasswordError(null);
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
        visible={showConfirmModal && !isLoading}
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
                marginBottom: 20,
              }}>
                Are you absolutely sure you want to delete your account? This will remove all your posts, connections, and data permanently.
              </Text>
              
              <Text style={{
                fontSize: 14,
                color: colors.text,
                marginBottom: 8,
                fontWeight: '500',
              }}>
                Enter your password to confirm:
              </Text>
              
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: passwordError ? '#FF4444' : colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 16,
                  color: colors.text,
                  backgroundColor: colors.background,
                  marginBottom: passwordError ? 4 : 0,
                }}
                placeholder="Enter your password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError(null);
                }}
                autoFocus
              />
              
              {passwordError && (
                <Text style={{
                  fontSize: 12,
                  color: '#FF4444',
                  marginBottom: 8,
                }}>
                  {passwordError}
                </Text>
              )}
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
                  backgroundColor: isLoading ? '#FF6666' : '#FF4444',
                  alignItems: 'center',
                  opacity: isLoading ? 0.7 : 1,
                }}
                onPress={handleConfirmDelete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: '#FFFFFF',
                    }}>
                      Deleting...
                    </Text>
                  </View>
                ) : (
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: '#FFFFFF',
                  }}>
                    Yes, Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Modal */}
      <Modal
        visible={isLoading && !showSuccess}
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
            width: '75%',
            maxWidth: 300,
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