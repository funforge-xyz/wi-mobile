import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';

interface ChatStatusBannerProps {
  pendingRequestStatus: 'none' | 'sent' | 'received';
  t: (key: string) => string;
}

export default function ChatStatusBanner({
  pendingRequestStatus,
  t,
}: ChatStatusBannerProps) {
  if (pendingRequestStatus === 'none') {
    return null;
  }

  const getBannerConfig = () => {
    if (pendingRequestStatus === 'sent') {
      return {
        icon: 'time-outline',
        text: t('nearby.requestSent'),
        color: COLORS.warning
      };
    } else if (pendingRequestStatus === 'received') {
      return {
        icon: 'mail-outline',
        text: t('chats.requestReceived', 'Request received'),
        color: COLORS.primary
      };
    }
    return null;
  };

  const config = getBannerConfig();
  if (!config) return null;

  return (
    <View style={styles.statusBannerContainer}>
      <View style={[styles.statusPill, { backgroundColor: config.color + '15', borderColor: config.color + '30' }]}>
        <Ionicons name={config.icon as any} size={14} color={config.color} />
        <Text style={[styles.statusPillText, { color: config.color }]}>
          {config.text}
        </Text>
      </View>
    </View>
  );
}

const styles = {
  statusBannerContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center' as const,
  },
  statusPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.xs,
  },
};