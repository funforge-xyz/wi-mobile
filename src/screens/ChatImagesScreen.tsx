
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/redux';
import { RootStackParamList } from '../types/navigation';
import ChatImagesHeader from '../components/ChatImagesHeader';
import ChatImagesContent from '../components/ChatImagesContent';
import { chatImagesStyles } from '../styles/ChatImagesStyles';
import { getChatImagesTitle, getChatImagesSubtitle, handleBackNavigation } from '../utils/chatImagesUtils';
import { COLORS } from '../config/constants';

type ChatImagesScreenRouteProp = RouteProp<RootStackParamList, 'ChatImages'>;

export default function ChatImagesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<ChatImagesScreenRouteProp>();
  const { t } = useTranslation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const { chatId } = route.params || {};

  const currentTheme = {
    background: isDarkMode ? COLORS.darkBackground : COLORS.background,
    surface: isDarkMode ? COLORS.darkSurface : COLORS.surface,
    text: isDarkMode ? COLORS.darkText : COLORS.text,
    textSecondary: isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary,
  };

  const onBackPress = () => {
    handleBackNavigation(navigation);
  };

  return (
    <SafeAreaView style={[chatImagesStyles.container, { backgroundColor: currentTheme.background }]}>
      <ChatImagesHeader
        onBackPress={onBackPress}
        title={getChatImagesTitle(chatId)}
        currentTheme={currentTheme}
      />
      
      <View style={{ flex: 1 }}>
        <ChatImagesContent
          title={getChatImagesTitle(chatId)}
          subtitle={getChatImagesSubtitle()}
          currentTheme={currentTheme}
        />
      </View>
    </SafeAreaView>
  );
}
