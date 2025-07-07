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
      setIsLoading(true);

      // Load dark mode settings first
      await loadDarkModeSettings(dispatch);

      // Initialize Firebase and check auth state with better error handling
      console.log('Checking auth state...');
      const isUserAuthenticated = await initializeFirebaseAndAuth();

      if (isUserAuthenticated) {
        console.log('User is authenticated, checking additional auth service');

        // Double-check with auth service
        const isAuthServiceAuthenticated = await authService.isAuthenticated();

        if (isAuthServiceAuthenticated) {
          console.log('Auth service confirms authentication');

          // Check if user has completed onboarding
          const hasCompletedOnboarding = await checkOnboardingStatus();

          if (hasCompletedOnboarding) {
            console.log('User has completed onboarding');

            // Load user settings and profile data
            const auth = getAuth();
            const currentUser = auth.currentUser;

            if (currentUser) {
              console.log('Loading user data for:', currentUser.uid);

              try {
                // Load user profile and language preference
                await Promise.all([
                  dispatch(fetchUserProfile(currentUser.uid)),
                  dispatch(loadUserLanguagePreference(currentUser.uid))
                ]);

                console.log('User data loaded successfully');
                setIsAuthenticated(true);
                setShowOnboarding(false);
              } catch (profileError) {
                console.error('Error loading user profile:', profileError);
                // Still consider authenticated but with limited data
                setIsAuthenticated(true);
                setShowOnboarding(false);
              }
            } else {
              console.log('No current user found after authentication check');
              setIsAuthenticated(false);
              setShowOnboarding(false);
            }
          } else {
            console.log('User has not completed onboarding');
            setIsAuthenticated(true);
            setShowOnboarding(true);
          }
        } else {
          console.log('Auth service reports user not authenticated');
          setIsAuthenticated(false);
          setShowOnboarding(false);
        }
      } else {
        console.log('User is not authenticated');
        setIsAuthenticated(false);
        setShowOnboarding(false);
      }

    } catch (error) {
      console.error('Error checking auth state:', error);
      setIsAuthenticated(false);
      setShowOnboarding(false);
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