
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/auth';
import { Settings } from '../services/storage';

export const getTabBarIcon = (routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap => {
  const iconMap: Record<string, { focused: string; unfocused: string }> = {
    Home: { focused: 'newspaper', unfocused: 'newspaper-outline' },
    Add: { focused: 'add-circle', unfocused: 'add-circle' },
    Nearby: { focused: 'people', unfocused: 'people-outline' },
    Chats: { focused: 'chatbubbles', unfocused: 'chatbubbles-outline' },
    Profile: { focused: 'person', unfocused: 'person-outline' },
  };

  const icons = iconMap[routeName];
  return (icons ? (focused ? icons.focused : icons.unfocused) : 'home-outline') as keyof typeof Ionicons.glyphMap;
};

export const initializeFirebaseAndAuth = async () => {
  try {
    console.log('Starting Firebase initialization...');
    const { initializeFirebase } = await import('../services/firebase');
    const firebaseServices = await initializeFirebase();
    console.log('Firebase initialization complete', {
      hasAuth: !!firebaseServices.auth,
      hasFirestore: !!firebaseServices.firestore,
      hasStorage: !!firebaseServices.storage
    });
    
    return true;
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    throw error;
  }
};

export const checkOnboardingStatus = async (settings: Settings) => {
  return await settings.getOnboardingDone();
};

export const loadDarkModeSettings = async (settings: Settings) => {
  return await settings.getDarkMode();
};

export const handleSignOut = async (
  setIsAuthenticated: (value: boolean) => void,
  setShowOnboarding: (value: boolean) => void,
  setIsLoading: (value: boolean) => void
) => {
  try {
    await authService.signOut();
    setIsAuthenticated(false);
    setShowOnboarding(false);
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

export const handleOnboardingComplete = async (
  settings: Settings,
  setShowOnboarding: (value: boolean) => void
) => {
  await settings.setOnboardingDone(true);
  setShowOnboarding(false);
};

export const setupSignOutCallback = (
  setIsAuthenticated: (value: boolean) => void,
  setShowOnboarding: (value: boolean) => void,
  setIsLoading: (value: boolean) => void
) => {
  authService.setOnSignOutCallback(() => {
    setIsAuthenticated(false);
    setShowOnboarding(false);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 50);
  });
};

export const getTabBarStyles = (isDarkMode: boolean) => ({
  backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
  borderTopColor: isDarkMode ? '#333333' : '#E5E5E5',
});

export const getTabBarLabelStyle = () => ({
  fontFamily: 'System',
  fontSize: 12,
});
