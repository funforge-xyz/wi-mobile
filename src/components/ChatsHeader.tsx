
import { View, Text } from 'react-native';
import { FONTS, SPACING } from '../config/constants';
import NotificationBell from './NotificationBell';

interface ChatsHeaderProps {
  title: string;
  onNotificationPress: () => void;
  currentTheme: any;
}

export default function ChatsHeader({
  title,
  onNotificationPress,
  currentTheme,
}: ChatsHeaderProps) {
  return (
    <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
      <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{title}</Text>
      <View style={styles.headerActions}>
        <NotificationBell
          onPress={onNotificationPress}
          color={currentTheme.text}
        />
      </View>
    </View>
  );
}

const styles = {
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  headerActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.sm,
  },
};
