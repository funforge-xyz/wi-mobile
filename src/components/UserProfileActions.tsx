import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../config/constants';

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

export default function UserProfileActions({
  onConnect,
  onMessage,
  onBlock,
  onDeleteConnection,
  currentTheme,
  isConnected,
  hasConnectionRequest,
  isBlocked,
  styles,
}: UserProfileActionsProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.menuSection, { backgroundColor: currentTheme.surface }]}>
      <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.warning || '#ff6b35' }]}
            onPress={onDeleteConnection}
          >
            <Ionicons name="person-remove-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>
              {t('userProfile.deleteConnection', 'Delete Connection')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.error }]}
            onPress={onBlock}
          >
            <Ionicons name="ban-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>
              {t('userProfile.blockUser', 'Block User')}
            </Text>
          </TouchableOpacity>
    </View>
  );
}