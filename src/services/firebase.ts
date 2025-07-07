
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { FIREBASE_API_KEY } from 'react-native-dotenv';

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

export const initializeFirebase = async () => {
  try {
    // Only initialize if not already initialized
    if (!app) {
      console.log('Initializing Firebase...');
      app = initializeApp(firebaseConfig);
      
      // Initialize services
      auth = getAuth(app);
      firestore = getFirestore(app);
      storage = getStorage(app);
      
      // Only initialize analytics in production or when needed
      try {
        analytics = getAnalytics(app);
      } catch (analyticsError) {
        console.log('Analytics not available in this environment');
      }
      
      console.log('Firebase initialized successfully');
    } else {
      console.log('Firebase already initialized');
    }
    
    return { app, auth, firestore, storage };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    console.error('Config:', { ...firebaseConfig, apiKey: '***' });
    throw error;
  }
};

// Getter functions to ensure components are initialized
export const getAuth = () => {
  if (!auth) {
    console.warn('Firebase Auth not initialized yet. Attempting to initialize...');
    return null;
  }
  return auth;
};

export const getFirestore = () => {
  if (!firestore) {
    console.warn('Firebase Firestore not initialized yet. Attempting to initialize...');
    return null;
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
