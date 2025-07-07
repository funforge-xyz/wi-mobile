` tags.

```typescript
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
```

```typescript
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
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FFFFFF',
  },
  blockButton: {
    backgroundColor: '#FF9500',
  },
  blockButtonText: {
    color: '#FFFFFF',
  },
});
```

```typescript
return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Delete Connection Button */}
      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={onDeleteConnection}
        activeOpacity={0.7}
      >
        <Ionicons name="person-remove" size={20} color="#FFFFFF" />
        <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
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
        <Text style={[styles.actionButtonText, styles.blockButtonText]}>
          {t('userProfile.blockUser', 'Block User')}
        </Text>
      </TouchableOpacity>
    </View>
  );
```

```
Fix button styling for UserProfileActions component
```

<replit_final_file>
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
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FFFFFF',
  },
  blockButton: {
    backgroundColor: '#FF9500',
  },
  blockButtonText: {
    color: '#FFFFFF',
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
        <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
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
        <Text style={[styles.actionButtonText, styles.blockButtonText]}>
          {t('userProfile.blockUser', 'Block User')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}