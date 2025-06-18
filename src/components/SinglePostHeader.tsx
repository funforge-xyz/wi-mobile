
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING } from '../config/constants';
import { useTranslation } from 'react-i18next';

interface SinglePostHeaderProps {
  onBack: () => void;
  onEdit?: () => void;
  canEdit: boolean;
  currentTheme: any;
}

export default function SinglePostHeader({
  onBack,
  onEdit,
  canEdit,
  currentTheme,
}: SinglePostHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
      <TouchableOpacity onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
        {t('singlePost.title')}
      </Text>
      {canEdit ? (
        <TouchableOpacity onPress={onEdit}>
          <Ionicons name="create-outline" size={24} color={currentTheme.text} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 24 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
});
