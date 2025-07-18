import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { useTranslation } from 'react-i18next';
import { getTabBarIcon, getTabBarStyles, getTabBarLabelStyle } from '../utils/rootUtils';

import FeedScreen from '../screens/FeedScreen';
import NearbyScreen from '../screens/NearbyScreen';
import ChatsScreen from '../screens/ChatsScreen';
import UserPostsScreen from '../screens/UserPostsScreen';

// Empty component for Add tab
const EmptyComponent = () => <View />;

const Tab = createBottomTabNavigator();

interface RootTabNavigatorProps {
  isDarkMode: boolean;
}

export default function RootTabNavigator({ isDarkMode }: RootTabNavigatorProps) {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getTabBarIcon(route.name, focused);
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: route.name === 'Home' ? '#FA4169' : COLORS.primary,
        tabBarInactiveTintColor: route.name === 'Home' ? 'rgba(255, 255, 255, 0.7)' : (isDarkMode ? '#B0B0B0' : COLORS.textSecondary),
        tabBarStyle: route.name === 'Home' 
          ? { 
              ...getTabBarStyles(isDarkMode), 
              backgroundColor: 'transparent',
              borderTopWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
              position: 'absolute'
            }
          : getTabBarStyles(isDarkMode),
        tabBarLabelStyle: getTabBarLabelStyle(),
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={FeedScreen}
        options={{ 
          tabBarLabel: t('navigation.home'),
          headerTitle: t('feed.title'),
          headerShown: false
        }}
      />
      <Tab.Screen 
        name="Nearby" 
        component={NearbyScreen}
        options={{ 
          tabBarLabel: t('navigation.nearby'),
          headerTitle: t('nearby.title'),
          headerShown: false
        }}
      />
      <Tab.Screen 
        name="Add" 
        component={EmptyComponent}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Camera' as never);
          },
        })}
        options={{ 
          tabBarLabel: t('navigation.add'),
          headerTitle: t('camera.title', 'Camera'),
          headerShown: false
        }}
      />
      <Tab.Screen 
        name="Chats" 
        component={ChatsScreen}
        options={{ 
          tabBarLabel: t('navigation.chats'),
          headerTitle: t('chats.title'),
          headerShown: false
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={UserPostsScreen}
        options={{ 
          tabBarLabel: t('navigation.profile'),
          headerTitle: t('profile.title'),
          headerShown: false
        }}
      />
    </Tab.Navigator>
  );
}