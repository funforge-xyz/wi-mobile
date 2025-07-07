import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONTS } from '../config/constants';

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
}

const styles = StyleSheet.create({
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
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.xs,
    color: '#FFFFFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  blockButton: {
    backgroundColor: '#FF9500',
  },
});

export default function UserProfileActions({
  onConnect,
  onMessage,
  onBlock,
  onDeleteConnection,
  currentTheme,
  isConnected,
  hasConnectionRequest,
  isBlocked,
}: UserProfileActionsProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.surface }]}>
      {/* Delete Connection Button */}
      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={onDeleteConnection}
        activeOpacity={0.7}
      >
        <Ionicons name="person-remove" size={20} color="#FFFFFF" />
        <Text style={styles.actionButtonText}>
          {t('userProfile.deleteConnection', 'Delete Connection')}
        </Text>
      </TouchableOpacity>

      {/* Block User Button */}
      <TouchableOpacity
        style={[styles.actionButton, styles.blockButton]}
        onPress={onBlock}
        activeOpacity={0.7}
      >
        <Ionicons name="ban" size={20} color="#FFFFFF" />
        <Text style={styles.actionButtonText}>
          {t('userProfile.blockUser', 'Block User')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}