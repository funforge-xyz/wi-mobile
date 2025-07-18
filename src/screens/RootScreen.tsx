import { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
import PulsingLogo from '../components/PulsingLogo';
import * as SplashScreen from 'expo-splash-screen';

import LoginScreen from './LoginScreen';
import OnboardingScreen from './OnboardingScreen';
import RootTabNavigator from '../components/RootTabNavigator';
import { darkTheme } from '../theme';
import { COLORS } from '../config/constants';
import { DarkTheme } from '@react-navigation/native';

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

    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsLoading(current => {
        if (current) {
          console.warn('Auth state check timed out, showing login screen');
          setIsAuthenticated(false);
          setShowOnboarding(false);
          return false;
        }
        return current;
      });
    }, 20000); // 20 second timeout to allow proper auth persistence

    return () => clearTimeout(timeout);
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);

      // Load dark mode settings
      try {
        await loadDarkModeSettings(dispatch);
        console.log('Dark mode settings loaded successfully');
      } catch (error) {
        console.error('Failed to load dark mode settings:', error);
        // Set default theme if loading fails
        dispatch(setTheme(false));
      }

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
      // In case of any error, show login screen instead of blank screen
      setIsAuthenticated(false);
      setShowOnboarding(false);
    } finally {
      // Always ensure loading is stopped, regardless of success, failure, or timeout
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await utilHandleOnboardingComplete();
      // Ensure we explicitly set showOnboarding to false
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still hide onboarding even if there's an error saving to storage
      setShowOnboarding(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    checkAuthState();
  };

  useEffect(() => {
    if(!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: DarkTheme.colors.background
      }}>
       <ActivityIndicator size="large" color={COLORS.primary}/>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return <RootTabNavigator isDarkMode={isDarkMode} />;
}