import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONTS } from '../config/constants';
import DeleteConnectionConfirmModal from './DeleteConnectionConfirmModal';
import DeleteConnectionSuccessModal from './DeleteConnectionSuccessModal';
import BlockUserConfirmationModal from './BlockUserConfirmationModal';
import BlockUserSuccessModal from './BlockUserSuccessModal';

interface UserProfileActionsProps {
  onConnect: () => void;
  onMessage: () => void;
  onBlock: () => void;
  onDeleteConnection: () => void;
  currentTheme: any;
  isConnected: boolean;
  hasConnectionRequest: boolean;
  isBlocked: boolean;
  styles: any;
  userName?: string;
  navigation?: any;
}

export default function UserProfileActions({
  onConnect,
  onMessage,
  onBlock,
  onDeleteConnection,
  currentTheme,
  isConnected,
  hasConnectionRequest,
  isBlocked,
  userName = '',
  navigation,
}: UserProfileActionsProps) {
  const { t } = useTranslation();
  const [showDeleteConnectionModal, setShowDeleteConnectionModal] = useState(false);
  const [showDeleteConnectionSuccessModal, setShowDeleteConnectionSuccessModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showBlockSuccessModal, setShowBlockSuccessModal] = useState(false);

  const handleDeleteConnectionPress = () => {
    setShowDeleteConnectionModal(true);
  };

  const handleConfirmDeleteConnection = () => {
    setShowDeleteConnectionModal(false);
    onDeleteConnection();
    setShowDeleteConnectionSuccessModal(true);
  };

  const handleDeleteConnectionSuccessClose = () => {
    setShowDeleteConnectionSuccessModal(false);
    if (navigation) {
      navigation.goBack();
    }
  };

  const handleBlockPress = () => {
    setShowBlockModal(true);
  };

  const handleConfirmBlock = async () => {
    try {
      if (onBlock) {
        await onBlock();
      }
      setShowBlockModal(false);
      setShowBlockSuccessModal(true);
    } catch (error) {
      console.error('Error blocking user:', error);
      setShowBlockModal(false);
    }
  };

  const handleCancelBlock = () => {
    setShowBlockModal(false);
  };

  const handleBlockSuccessClose = () => {
    setShowBlockSuccessModal(false);
    if (navigation) {
      navigation.goBack();
    }
  };

  const localStyles = StyleSheet.create({
    container: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: 12,
      marginBottom: SPACING.sm,
      minHeight: 48,
      borderWidth: 1,
    },
    actionButtonText: {
      fontSize: 16,
      fontFamily: FONTS.medium,
      marginLeft: SPACING.xs,
    },
    deleteButton: {
      borderColor: '#FF9500',
    },
    deleteButtonText: {
      color: '#FF9500',
    },
    blockButton: {
      borderColor: '#FF3B30',
    },
    blockButtonText: {
      color: '#FF3B30',
    },
  });

  return (
    <>
      <View style={[localStyles.container, { backgroundColor: currentTheme.background }]}>
        {/* Delete Connection Button */}
        <TouchableOpacity
          style={[localStyles.actionButton, localStyles.deleteButton, { borderColor: currentTheme.border }]}
          onPress={handleDeleteConnectionPress}
          activeOpacity={0.7}
        >
          <Ionicons name="person" size={20} color="#FF9500" />
          <Text style={[localStyles.actionButtonText, localStyles.deleteButtonText]}>
            {t('userProfile.deleteConnection', 'Delete Connection')}
          </Text>
        </TouchableOpacity>

        {/* Block User Button */}
        <TouchableOpacity
          style={[localStyles.actionButton, localStyles.blockButton, { borderColor: currentTheme.border }]}
          onPress={handleBlockPress}
          activeOpacity={0.7}
        >
          <Ionicons name="ban" size={20} color="#FF3B30" />
          <Text style={[localStyles.actionButtonText, localStyles.blockButtonText]}>
            {t('userProfile.blockUser', 'Block User')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Delete Connection Confirmation Modal */}
      <DeleteConnectionConfirmModal
        visible={showDeleteConnectionModal}
        onConfirm={handleConfirmDeleteConnection}
        onCancel={() => setShowDeleteConnectionModal(false)}
        userName={userName}
        currentTheme={currentTheme}
      />

      {/* Delete Connection Success Modal */}
      <DeleteConnectionSuccessModal
        visible={showDeleteConnectionSuccessModal}
        onClose={handleDeleteConnectionSuccessClose}
        currentTheme={currentTheme}
      />

      {/* Block User Confirmation Modal */}
      <BlockUserConfirmationModal
        visible={showBlockModal}
        onConfirm={handleConfirmBlock}
        onCancel={handleCancelBlock}
        currentTheme={currentTheme}
      />

      {/* Block User Success Modal */}
      <BlockUserSuccessModal
        visible={showBlockSuccessModal}
        onClose={handleBlockSuccessClose}
        currentTheme={currentTheme}
      />
    </>
  );
}