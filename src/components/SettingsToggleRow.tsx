
import { View, Text, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { styles } from '../styles/SettingsStyles';

interface SettingsToggleRowProps {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  currentTheme: any;
}

export default function SettingsToggleRow({ 
  icon, 
  title, 
  description, 
  value, 
  onValueChange, 
  disabled = false,
  currentTheme 
}: SettingsToggleRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Ionicons 
          name={icon as any} 
          size={20} 
          color={currentTheme.text} 
          style={styles.settingIcon}
        />
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
            {title}
          </Text>
          <Text style={[styles.settingDescription, { color: currentTheme.textSecondary }]}>
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: currentTheme.border, true: COLORS.primary }}
        thumbColor={value ? 'white' : '#f4f3f4'}
      />
    </View>
  );
}
