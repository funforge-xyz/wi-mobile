
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { getTheme } from '../theme';
import { authService } from '../services/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function DeleteAccountScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const colors = getTheme(isDarkMode);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleDeletePress = () => {
    setError(null); // Clear any previous errors
    setPassword('');
    setPasswordError(null);
    setShowPassword(false);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }

    // Clear previous errors
    setPasswordError(null);
    setError(null);
    
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
          // Navigate back to root login screen
          (navigation as any).reset({
            index: 0,
            routes: [{ name: 'Root' as never }],
          });
        } catch (logoutError) {
          console.error('Logout error after account deletion:', logoutError);
          // Even if logout fails, the account is deleted, navigate to root
          (navigation as any).reset({
            index: 0,
            routes: [{ name: 'Root' as never }],
          });
        }
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
        setError('For security reasons, please sign out and sign back in before deleting your account.');
      } else {
        setShowConfirmModal(false);
        setError('Failed to delete account. Please try again.');
      }
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setPassword('');
    setPasswordError(null);
    setShowPassword(false);
  };

  const handleBackPress = () => {
    if (!isLoading && !showSuccess) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: colors.background,
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={{
            padding: 8,
            marginRight: 8,
          }}
          disabled={isLoading || showSuccess}
        >
          <Icon 
            name="arrow-back" 
            size={24} 
            color={isLoading || showSuccess ? colors.textSecondary : colors.text} 
          />
        </TouchableOpacity>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: colors.text,
        }}>
          {t('settings.deleteAccount')}
        </Text>
      </View>

      {/* Content */}
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#FF4444',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <Icon name="warning" size={40} color="#FFFFFF" />
        </View>

        <Text style={{
          fontSize: 24,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 12,
          textAlign: 'center',
        }}>
          Delete Your Account
        </Text>

        <Text style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: 40,
          paddingHorizontal: 20,
        }}>
          This action will permanently delete your account and all associated data including:
        </Text>

        <View style={{
          alignSelf: 'stretch',
          marginBottom: 40,
        }}>
          {[
            'All your posts and media',
            'All connections and messages',
            'All likes and comments',
            'Your profile information',
            'All account data'
          ].map((item, index) => (
            <View key={index} style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
              paddingHorizontal: 20,
            }}>
              <Icon name="close" size={16} color="#FF4444" style={{ marginRight: 12 }} />
              <Text style={{
                fontSize: 14,
                color: colors.textSecondary,
              }}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        <Text style={{
          fontSize: 14,
          color: '#FF4444',
          textAlign: 'center',
          fontWeight: '500',
          marginBottom: 40,
        }}>
          This action cannot be undone.
        </Text>

        {error && (
          <View style={{
            backgroundColor: '#FFE5E5',
            borderWidth: 1,
            borderColor: '#FF4444',
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
            alignSelf: 'stretch',
            marginHorizontal: 20,
          }}>
            <Text style={{
              fontSize: 14,
              color: '#FF4444',
              textAlign: 'center',
              fontWeight: '500',
            }}>
              {error}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={{
            backgroundColor: '#FF4444',
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 12,
            minWidth: 200,
            alignItems: 'center',
          }}
          onPress={handleDeletePress}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#FFFFFF',
          }}>
            Delete My Account
          </Text>
        </TouchableOpacity>
      </View>

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
              
              <View style={{
                position: 'relative',
                width: '100%',
                marginBottom: passwordError ? 4 : 0,
              }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: passwordError ? '#FF4444' : colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    paddingRight: 50,
                    fontSize: 16,
                    color: colors.text,
                    backgroundColor: colors.background,
                    width: '100%',
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError(null);
                  }}
                  autoFocus
                />
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    padding: 4,
                  }}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon 
                    name={showPassword ? "visibility-off" : "visibility"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
              
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
            width: '75%',
            maxWidth: 300,
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
    </SafeAreaView>
  );
}
