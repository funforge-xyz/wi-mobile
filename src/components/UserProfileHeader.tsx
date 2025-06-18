;
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface UserProfileHeaderProps {
  onBackPress: () => void;
  currentTheme: any;
  styles: any;
}

export default function UserProfileHeader({ onBackPress, currentTheme, styles }: UserProfileHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
      <TouchableOpacity onPress={onBackPress}>
        <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{t('userProfile.title')}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
}