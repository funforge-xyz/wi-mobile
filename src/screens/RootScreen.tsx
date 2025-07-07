import { useState, useEffect } from 'react';
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
import { fetchUserProfile, loadUserLanguagePreference } from '../store/userSlice';
import { getAuth } from 'firebase/auth';
import { authService } from '../services/auth';

import LoginScreen from './LoginScreen';
import OnboardingScreen from './OnboardingScreen';
import RootTabNavigator from '../components/RootTabNavigator';

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
      // First, ensure Firebase is fully initialized
      console.log('Initializing Firebase in RootScreen...');
      await initializeFirebaseAndAuth();
      
      // Now check if user is authenticated
      const isLoggedIn = await authService.isAuthenticated();
      setIsAuthenticated(isLoggedIn);

      if (isLoggedIn) {
        const onboardingDone = await checkOnboardingStatus(settings);
        setShowOnboarding(!onboardingDone);

        // Load user profile and update Redux state
        dispatch(fetchUserProfile());

        // Get auth safely since we know Firebase is initialized
        const auth = getAuth();
        const currentUser = auth.currentUser;

        // Load user's preferred language from Firebase
        if (currentUser?.uid) {
          dispatch(loadUserLanguagePreference(currentUser.uid));
        }
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
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return <RootTabNavigator isDarkMode={isDarkMode} />;
}