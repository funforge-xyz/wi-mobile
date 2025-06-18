
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface UserPostsEmptyStateProps {
  currentTheme: any;
  styles: any;
}

export default function UserPostsEmptyState({ currentTheme, styles }: UserPostsEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.emptyContainer, { minHeight: 300 }]}>
      <Ionicons
        name="document-text-outline"
        size={64}
        color={currentTheme.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
        {t('profile.noPosts')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
        {t('profile.shareFirst')}
      </Text>
    </View>
  );
}
