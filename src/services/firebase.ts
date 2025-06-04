
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore as getFirestoreSDK } from 'firebase/firestore';
import { getStorage as getStorageSDK } from 'firebase/storage';
import { getAnalytics as getAnalyticsSDK } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {FIREBASE_API_KEY} from 'react-native-dotenv';

const firebaseConfig = {
  projectId: "wichat-2684e",
  storageBucket: "wichat-2684e.appspot.com",
  apiKey: FIREBASE_API_KEY,
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
      
      firestore = getFirestoreSDK(app);
      storage = getStorageSDK(app);
      
      // Only initialize analytics in production or when needed
      try {
        analytics = getAnalyticsSDK(app);
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

export const getFirebaseAnalytics = () => {
  if (!analytics) {
    throw new Error('Firebase Analytics not initialized. Call initializeFirebase() first.');
  }
  return analytics;
};

// Export initialized instances (will be null until initializeFirebase is called)
export { auth, firestore, storage, analytics };
export default app;
