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
  if (pendingRequestStatus !== 'sent') {
    return null;
  }

  return (
    <View style={styles.statusBannerContainer}>
      <View style={[styles.statusPill, { backgroundColor: COLORS.warning + '15', borderColor: COLORS.warning + '30' }]}>
        <Ionicons name="time-outline" size={14} color={COLORS.warning} />
        <Text style={[styles.statusPillText, { color: COLORS.warning }]}>
          {t('nearby.requestSent')} • {t('common.loading')}
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