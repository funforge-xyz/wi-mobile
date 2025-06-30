
import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Settings } from '../services/storage';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { setTheme } from '../store/themeSlice';
import {
  initializeFirebaseAndAuth,
  checkOnboardingStatus,
  loadDarkModeSettings,
  handleOnboardingComplete as utilHandleOnboardingComplete,
  setupSignOutCallback,
} from '../utils/rootUtils';

import LoginScreen from './LoginScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import OnboardingScreen from './OnboardingScreen';
import RootTabNavigator from '../components/RootTabNavigator';

const Stack = createStackNavigator();

export default function RootScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const dispatch = useAppDispatch();
  const settings = new Settings();

  useEffect(() => {
    checkAuthState();
    setupSignOutCallback(setIsAuthenticated, setShowOnboarding, setIsLoading);
  }, []);

  const checkAuthState = async () => {
    try {
      const isLoggedIn = await initializeFirebaseAndAuth();
      setIsAuthenticated(isLoggedIn);

      if (isLoggedIn) {
        const onboardingDone = await checkOnboardingStatus(settings);
        setShowOnboarding(!onboardingDone);
      }

      const darkMode = await loadDarkModeSettings(settings);
      dispatch(setTheme(darkMode));
    } catch (error) {
      console.error('Error checking auth state:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    await utilHandleOnboardingComplete(settings, setShowOnboarding);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    checkAuthState();
  };

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} initialParams={{ onLoginSuccess: handleLoginSuccess }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return <RootTabNavigator isDarkMode={isDarkMode} />;
}
