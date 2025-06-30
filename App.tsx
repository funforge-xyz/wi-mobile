import { useEffect, useState } from 'react';
import { AppState, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import './src/i18n';

// Screens
import RootScreen from './src/screens/RootScreen';
import ChatImagesScreen from './src/screens/ChatImagesScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TermsScreen from './src/screens/TermsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';

// Services
import { initializeFirebase } from './src/services/firebase';
import { initializeNotifications, registerForPushNotifications } from './src/services/notifications';

// Types
import { RootStackParamList } from './src/types/navigation';
import SinglePostScreen from './src/screens/SinglePostScreen';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize Firebase first
        console.log('Starting Firebase initialization...');
        await initializeFirebase();
        console.log('Firebase initialization complete');

        // Load fonts
        await Font.loadAsync({
          // Add your custom fonts here if needed
        });

      } catch (e) {
        console.error('App initialization error:', e);
        Alert.alert('Initialization Error', 'Failed to start the app. Please restart.');
      } finally {
        setIsLoading(false);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    initializeNotifications();

    // Register for push notifications explicitly
    const setupPushNotifications = async () => {
      try {
        const { registerForPushNotifications } = await import('./src/services/notifications');
        await registerForPushNotifications();
      } catch (error) {
        console.error('Failed to register for push notifications:', error);
      }
    };

    // Delay registration slightly to ensure app is fully loaded
    setTimeout(setupPushNotifications, 2000);

    // Handle app state changes to refresh notifications when app comes to foreground
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App came to foreground - this will trigger notification bell to refresh
        console.log('App active - notifications can refresh');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Root"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Root" component={RootScreen} />
            <Stack.Screen name="ChatImages" component={ChatImagesScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen 
          name="SinglePost" 
          component={SinglePostScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="UserProfile" 
          component={UserProfileScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ProfileSettings" 
          component={ProfileScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="HelpSupport" 
          component={HelpSupportScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="PrivacyPolicy" 
          component={PrivacyPolicyScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}