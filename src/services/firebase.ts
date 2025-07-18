
import { initializeApp } from 'firebase/app';
import { 
  getAuth as getFirebaseAuth, 
  initializeAuth, 
  getReactNativePersistence,
  connectAuthEmulator 
} from 'firebase/auth';
import { getFirestore as getFirebaseFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage as getFirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { FIREBASE_API_KEY } from 'react-native-dotenv';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  projectId: "wichat-a6e48",
  storageBucket: "wichat-a6e48.firebasestorage.app",
  apiKey: FIREBASE_API_KEY,
  authDomain: "wichat-a6e48.firebaseapp.com",
  messagingSenderId: "38067432350",
  appId: "1:38067432350:web:735be2b68842788282448f",
};

let app: any = null;
let auth: any = null;
let firestore: any = null;
let storage: any = null;
let analytics: any = null;
let isInitialized = false;
let initializationPromise: Promise<any> | null = null;

export const initializeFirebase = async () => {
  // If already initialized, return existing instances
  if (isInitialized && app && auth && firestore && storage) {
    return { app, auth, firestore, storage };
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return await initializationPromise;
  }

  // Start initialization
  initializationPromise = (async () => {
    try {
      console.log('Initializing Firebase...');
      
      // Initialize app
      app = initializeApp(firebaseConfig);
      
      // Initialize Auth with explicit persistence for React Native
      try {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
      } catch (error: any) {
        // If auth is already initialized, get the existing instance
        if (error.code === 'auth/already-initialized') {
          auth = getFirebaseAuth(app);
        } else {
          throw error;
        }
      }
      
      firestore = getFirebaseFirestore(app);
      storage = getFirebaseStorage(app);
      
      // Monitor Firestore connection state
      const { enableNetwork, disableNetwork } = await import('firebase/firestore');
      
      // Add connection state listener
      const handleConnectionStateChange = () => {
        console.log('Firestore connection state changed');
      };
      
      // Enable network by default
      try {
        await enableNetwork(firestore);
        console.log('Firestore network enabled');
      } catch (networkError) {
        console.warn('Firestore network enable failed:', networkError);
      }
      
      // Only initialize analytics in production or when needed
      try {
        analytics = getAnalytics(app);
      } catch (analyticsError) {
        console.log('Analytics not available in this environment');
      }
      
      isInitialized = true;
      console.log('Firebase initialized successfully');
      
      return { app, auth, firestore, storage };
    } catch (error) {
      console.error('Firebase initialization error:', error);
      console.error('Config:', { ...firebaseConfig, apiKey: '***' });
      
      // Reset promise so we can retry
      initializationPromise = null;
      throw error;
    }
  })();

  return await initializationPromise;
};

// Getter functions that ensure Firebase is initialized
export const getAuth = () => {
  if (!isInitialized || !auth) {
    console.error('Firebase Auth not initialized. Current state:', { isInitialized, authExists: !!auth });
    throw new Error('Firebase Auth not initialized. Call initializeFirebase() first.');
  }
  return auth;
};

export const getFirestore = () => {
  if (!isInitialized || !firestore) {
    throw new Error('Firebase Firestore not initialized. Call initializeFirebase() first.');
  }
  return firestore;
};

export const getStorage = () => {
  if (!isInitialized || !storage) {
    throw new Error('Firebase Storage not initialized. Call initializeFirebase() first.');
  }
  return storage;
};

export const getFirebaseAnalytics = () => {
  if (!analytics) {
    throw new Error('Firebase Analytics not initialized. Call initializeFirebase() first.');
  }
  return analytics;
};

// Export initialized instances (will be null until initializeFirebase is called)
export { auth, firestore, storage, analytics };
export default app;
