
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/SettingsStyles';

interface SettingsHeaderProps {
  onBackPress: () => void;
  currentTheme: any;
}

export default function SettingsHeader({ onBackPress, currentTheme }: SettingsHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
      <TouchableOpacity onPress={onBackPress}>
        <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
        {t('settings.title')}
      </Text>
      <View style={{ width: 24 }} />
    </View>
  );
}
