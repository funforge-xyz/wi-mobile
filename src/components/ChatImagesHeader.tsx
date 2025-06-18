
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatImagesStyles } from '../styles/ChatImagesStyles';

interface ChatImagesHeaderProps {
  onBackPress: () => void;
  title: string;
  currentTheme: any;
}

export default function ChatImagesHeader({
  onBackPress,
  title,
  currentTheme,
}: ChatImagesHeaderProps) {
  return (
    <View style={[chatImagesStyles.header, { backgroundColor: currentTheme.surface }]}>
      <TouchableOpacity style={chatImagesStyles.backButton} onPress={onBackPress}>
        <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
      </TouchableOpacity>
      <Text style={[chatImagesStyles.headerTitle, { color: currentTheme.text }]}>
        {title}
      </Text>
      <View style={chatImagesStyles.headerRight} />
    </View>
  );
}
