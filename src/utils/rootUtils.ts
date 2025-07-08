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
    console.log('Initializing Firebase...');

    // Initialize Firebase first
    const { initializeFirebase } = await import('../services/firebase');
    const { authService } = await import('../services/auth');

    await initializeFirebase();

    // Import getAuth after Firebase is initialized
    const { getAuth } = await import('../services/firebase');
    const auth = getAuth();

    // Get auth instance and wait for initial auth state
    const { onAuthStateChanged, signOut } = await import('firebase/auth');

    // Wait for auth state to be determined with a longer timeout
    return new Promise((resolve) => {
      let resolved = false;
      let timeout: NodeJS.Timeout;

      // Set a timeout to prevent hanging
      timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log('Auth state timeout - assuming not authenticated');
          clearTimeout(timeout);
          resolve(false);
        }
      }, 18000); // 18 second timeout for better persistence handling

      // Listen for auth state changes with persistence in mind
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (resolved) return;

        try {
          if (user) {
            console.log('User authenticated from persistence:', user.uid);

            // Reload user to get fresh data from server
            await user.reload();

            // Check if email is verified
            if (!user.emailVerified) {
              console.log('User email not verified, signing out');
              await signOut(auth);
              resolved = true;
              clearTimeout(timeout);
              resolve(false);
              return;
            }

            // Verify token is still valid
            try {
              await user.getIdToken(true); // Force refresh
              const isAuth = await authService.isAuthenticated();
              resolved = true;
              clearTimeout(timeout);
              resolve(isAuth);
            } catch (tokenError) {
              console.error('Token validation failed:', tokenError);
              await signOut(auth);
              resolved = true;
              clearTimeout(timeout);
              resolve(false);
            }
          } else {
            console.log('No user authenticated from persistence');
            resolved = true;
            clearTimeout(timeout);
            resolve(false);
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error);
          resolved = true;
          clearTimeout(timeout);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
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

export const loadDarkModeSettings = async (dispatch: any) => {
  try {
    const { SettingsService } = await import('../services/settings');
    const settingsService = SettingsService.getInstance();

    // First load the settings
    const settings = await settingsService.loadSettings();

    // Import setTheme action
    const { setTheme } = await import('../store/themeSlice');

    // Set the theme in Redux store
    dispatch(setTheme(settings.darkMode));

    console.log('Dark mode settings loaded and applied:', settings.darkMode);
    console.log('Full settings loaded:', settings);
  } catch (error) {
    console.error('Error loading dark mode settings:', error);
    // Set default to light mode if loading fails
    const { setTheme } = await import('../store/themeSlice');
    dispatch(setTheme(false));
  }
};

export const checkOnboardingStatus = async (): Promise<boolean> => {
  try {
    const { Settings } = await import('../services/storage');
    const settings = new Settings();
    return await settings.getOnboardingDone();
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

export const handleOnboardingComplete = async (
  setShowOnboarding: (value: boolean) => void
) => {
  const { Settings } = await import('../services/storage');
  const settings = new Settings();
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

export const utilHandleOnboardingComplete = async (
  settings: Settings,
  setShowOnboarding: (show: boolean) => void
) => {
  try {
    console.log('Saving onboarding completion...');
    await settings.setOnboardingCompleted(true);
    console.log('Onboarding completion saved successfully');
    setShowOnboarding(false);
  } catch (error) {
    console.error('Error saving onboarding completion:', error);
    // Still hide onboarding even if saving fails
    setShowOnboarding(false);
  }
};