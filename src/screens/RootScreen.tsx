
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../config/constants';
import { Settings } from '../services/storage';
import { authService } from '../services/auth';

import HomeScreen from './HomeScreen';
import FeedScreen from './FeedScreen';
import NearbyScreen from './NearbyScreen';
import ChatsScreen from './ChatsScreen';
import ProfileScreen from './ProfileScreen';
import OnboardingScreen from './OnboardingScreen';
import LoginScreen from './LoginScreen';
import AddPostScreen from './AddPostScreen';

const Tab = createBottomTabNavigator();

export default function RootScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const settings = new Settings();

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const isLoggedIn = await authService.isAuthenticated();
      setIsAuthenticated(isLoggedIn);
      
      if (isLoggedIn) {
        const onboardingDone = await settings.getOnboardingDone();
        setShowOnboarding(!onboardingDone);
      }
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
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Feed') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          } else if (route.name === 'Add') {
            iconName = 'add-circle';
          } else if (route.name === 'Nearby') {
            iconName = focused ? 'location' : 'location-outline';
          } else if (route.name === 'Chats') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else {
            iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.medium,
          fontSize: 12,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen 
        name="Add" 
        component={AddPostScreen}
        options={{
          tabBarLabel: '',
          tabBarIconStyle: { marginTop: 5 },
        }}
      />
      <Tab.Screen name="Nearby" component={NearbyScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
    </Tab.Navigator>
  );
}
