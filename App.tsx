import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';

// Screens
import RootScreen from './src/screens/RootScreen';
import ChatImagesScreen from './src/screens/ChatImagesScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DeleteAccountScreen from './src/screens/DeleteAccountScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import TermsScreen from './src/screens/TermsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';

// Services
import { initializeFirebase } from './src/services/firebase';
import { initializeNotifications } from './src/services/notifications';

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
        // Initialize Firebase
        await initializeFirebase();

        // Initialize notifications
        await initializeNotifications();

        // Handle notification taps
        const notificationResponse = Notifications.addNotificationResponseReceivedListener(response => {
          const data = response.notification.request.content.data;
          console.log('Notification tapped:', data);

          // Use a timeout to ensure navigation is ready
          setTimeout(() => {
            // Handle navigation based on notification type
            if (data.type === 'like' || data.type === 'comment') {
              // Navigate to post screen
              if (data.postId) {
                // You'll need to get navigation reference to navigate
                // For now, this will be handled by the notification screen navigation
              }
            } else if (data.type === 'nearby_request') {
              // Navigate to chat with the requesting user
              if (data.fromUserId && data.fromUserName) {
                // Navigate to chat screen directly
                // This will be handled by the notification press in NotificationsScreen
              }
            }
          }, 1000);
        });

        // Load fonts
        await Font.loadAsync({
          // Add your custom fonts here if needed
        });

      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoading(false);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    initializeNotifications();

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
            <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
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
      </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}