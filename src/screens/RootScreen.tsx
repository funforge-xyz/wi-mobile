import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../config/constants';
import { Settings } from '../services/storage';
import { authService } from '../services/auth';

import FeedScreen from './FeedScreen';
import NearbyScreen from './NearbyScreen';
import ChatsScreen from './ChatsScreen';
import ProfileScreen from './ProfileScreen';
import UserPostsScreen from './UserPostsScreen';
import OnboardingScreen from './OnboardingScreen';
import LoginScreen from './LoginScreen';
import AddPostScreen from './AddPostScreen';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { setTheme } from '../store/themeSlice';
import SinglePostScreen from './SinglePostScreen';

// Redux imports

const Tab = createBottomTabNavigator();

export default function RootScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const dispatch = useAppDispatch();
  const settings = new Settings();

  useEffect(() => {
    checkAuthState();

    // Set up sign out callback to reset navigation
    authService.setOnSignOutCallback(() => {
      // Reset all navigation state completely
      setIsAuthenticated(false);
      setShowOnboarding(false);
      // Force a complete reset of the component
      setIsLoading(true);
      // Clear any cached state
      setTimeout(() => {
        setIsLoading(false);
      }, 50);
    });
  }, []);

  const checkAuthState = async () => {
    try {
      // Ensure Firebase is initialized
      const { initializeFirebase } = await import('../services/firebase');
      await initializeFirebase();

      const isLoggedIn = await authService.isAuthenticated();
      setIsAuthenticated(isLoggedIn);

      if (isLoggedIn) {
        const onboardingDone = await settings.getOnboardingDone();
        setShowOnboarding(!onboardingDone);
      }

      // Load dark mode setting
      const darkMode = await settings.getDarkMode();
      dispatch(setTheme(darkMode));
    } catch (error) {
      console.error('Error checking auth state:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    await settings.setOnboardingDone(true);
    setShowOnboarding(false);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    checkAuthState(); // Recheck to determine if onboarding is needed
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setIsAuthenticated(false);
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return null; // You could add a loading screen here
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          } else if (route.name === 'Add') {
            iconName = 'add-circle';
          } else if (route.name === 'Nearby') {
            iconName = focused ? 'location' : 'location-outline';
          } else if (route.name === 'Chats') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: isDarkMode ? '#B0B0B0' : COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1E1E1E' : COLORS.surface,
          borderTopColor: isDarkMode ? '#333333' : COLORS.border,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.medium,
          fontSize: 12,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={FeedScreen} />
      <Tab.Screen name="Nearby" component={NearbyScreen} />
      <Tab.Screen 
        name="Add" 
        component={AddPostScreen}
      />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Profile" component={UserPostsScreen} />
    </Tab.Navigator>
  );
}