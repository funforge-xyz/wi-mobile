
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  projectId: "wichat-2684e",
  storageBucket: "wichat-2684e.appspot.com",
  apiKey: "AIzaSyDummyKeyForDevelopment", // Replace with your actual API key
  authDomain: "wichat-2684e.firebaseapp.com",
  messagingSenderId: "350425373122",
  appId: "1:350425373122:android:d88c1c32c9b7e8275dde5b",
};

let app: any = null;
let auth: any = null;
let firestore: any = null;
let storage: any = null;
let analytics: any = null;

export const initializeFirebase = async () => {
  try {
    // Only initialize if not already initialized
    if (!app) {
      app = initializeApp(firebaseConfig);
      
      // Initialize Auth with AsyncStorage persistence
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
      
      firestore = getFirestore(app);
      storage = getStorage(app);
      
      // Only initialize analytics in production or when needed
      try {
        analytics = getAnalytics(app);
      } catch (analyticsError) {
        console.log('Analytics not available in this environment');
      }
      
      console.log('Firebase initialized successfully');
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

// Getter functions to ensure components are initialized
export const getAuth = () => {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Call initializeFirebase() first.');
  }
  return auth;
};

export const getFirestore = () => {
  if (!firestore) {
    throw new Error('Firebase Firestore not initialized. Call initializeFirebase() first.');
  }
  return firestore;
};

export const getStorage = () => {
  if (!storage) {
    throw new Error('Firebase Storage not initialized. Call initializeFirebase() first.');
  }
  return storage;
};

export { auth, firestore, storage, analytics };
export default app;
