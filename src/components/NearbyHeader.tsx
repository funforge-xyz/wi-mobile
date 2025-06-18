
import { View, Text } from 'react-native';
import NotificationBell from './NotificationBell';
import { styles } from '../styles/NearbyStyles';

interface NearbyHeaderProps {
  title: string;
  currentTheme: any;
  onNotificationPress: () => void;
}

export default function NearbyHeader({
  title,
  currentTheme,
  onNotificationPress,
}: NearbyHeaderProps) {
  return (
    <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
      <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{title}</Text>
      <NotificationBell 
        onPress={onNotificationPress} 
        color={currentTheme.text}
      />
    </View>
  );
}
