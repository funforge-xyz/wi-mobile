
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/SettingsStyles';

interface SettingsActionRowProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  iconColor?: string;
  titleColor?: string;
  value?: string;
  currentTheme: any;
}

export default function SettingsActionRow({ 
  icon, 
  title, 
  description, 
  onPress,
  iconColor,
  titleColor,
  value,
  currentTheme 
}: SettingsActionRowProps) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingInfo}>
        <Ionicons 
          name={icon as any} 
          size={20} 
          color={iconColor || currentTheme.text} 
          style={styles.settingIcon}
        />
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: titleColor || currentTheme.text }]}>
            {title}
          </Text>
          <Text style={[styles.settingDescription, { color: currentTheme.textSecondary }]}>
            {description}
          </Text>
        </View>
      </View>
      {value ? (
        <View style={styles.radiusDropdown}>
          <Text style={[styles.radiusDropdownText, { color: currentTheme.text }]}>
            {value}
          </Text>
          <Ionicons name="chevron-down" size={16} color={currentTheme.textSecondary} />
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
      )}
    </TouchableOpacity>
  );
}
