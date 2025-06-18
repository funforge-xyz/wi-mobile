
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/PrivacyPolicyStyles';

interface PolicyHeaderProps {
  title: string;
  onBackPress: () => void;
  currentTheme: any;
}

export default function PolicyHeader({ title, onBackPress, currentTheme }: PolicyHeaderProps) {
  return (
    <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBackPress}
      >
        <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: currentTheme.text }]}>{title}</Text>
    </View>
  );
}
