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

export const initializeFirebaseAndAuth = async (): Promise<boolean> => {
  try {
    console.log('Starting Firebase initialization...');

    // Initialize Firebase first
    const { initializeFirebase } = await import('../services/firebase');
    const firebaseServices = await initializeFirebase();
    console.log('Firebase initialized successfully');

    // Get auth instance and wait for initial auth state
    const { getAuth, onAuthStateChanged, signOut } = await import('firebase/auth');
    const auth = getAuth();

    // Wait for auth state to be determined with a longer timeout
    return new Promise((resolve) => {
      let resolved = false;

      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log('Auth state check timed out, assuming no user');
          resolve(false);
        }
      }, 10000); // 10 second timeout

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (resolved) return;

        unsubscribe(); // Only need the first auth state change
        clearTimeout(timeout);
        resolved = true;

        if (user) {
          console.log('User found during initialization:', user.uid);

          try {
            // Ensure user is verified
            await user.reload();
            const currentUser = auth.currentUser;

            if (currentUser && currentUser.emailVerified) {
              console.log('User is verified and authenticated');
              resolve(true);
            } else {
              console.log('User is not verified');
              if (currentUser) {
                await signOut(auth);
              }
              resolve(false);
            }
          } catch (error) {
            console.error('Error reloading user:', error);
            resolve(false);
          }
        } else {
          console.log('No user found during initialization');
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
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