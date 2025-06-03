
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

let app: any;
let auth: any;
let firestore: any;
let storage: any;
let analytics: any;

export const initializeFirebase = async () => {
  try {
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
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

export { auth, firestore, storage, analytics };
export default app;
