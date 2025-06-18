import { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/SettingsStyles';

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
  currentTheme: any;
}

export default function SettingsSection({ title, children, currentTheme }: SettingsSectionProps) {
  return (
    <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{title}</Text>
      {children}
    </View>
  );
}
