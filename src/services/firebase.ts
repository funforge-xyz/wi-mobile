import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import messaging from '@react-native-firebase/messaging';

// These will be initialized automatically by React Native Firebase
let firebaseAuth: any = null;
let firebaseFirestore: any = null;
let firebaseStorage: any = null;
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import messaging from '@react-native-firebase/messaging';

let firebaseAuth: any = null;
let firebaseFirestore: any = null;
let firebaseStorage: any = null;
let firebaseMessaging: any = null;

export const initializeFirebase = async () => {
  try {
    console.log('Initializing React Native Firebase...');

    // React Native Firebase is automatically initialized
    firebaseAuth = auth();
    firebaseFirestore = firestore();
    firebaseStorage = storage();
    firebaseMessaging = messaging();

    console.log('React Native Firebase initialized successfully');

    return { 
      auth: firebaseAuth, 
      firestore: firebaseFirestore, 
      storage: firebaseStorage,
      messaging: firebaseMessaging 
    };
  } catch (error) {
    console.error('React Native Firebase initialization error:', error);
    throw error;
  }
};

// Getter functions to ensure components are initialized
export const getAuth = () => {
  if (!firebaseAuth) {
    console.warn('Firebase Auth not initialized yet. Attempting to initialize...');
    firebaseAuth = auth();
  }
  return firebaseAuth;
};

export const getFirestore = () => {
  if (!firebaseFirestore) {
    console.warn('Firebase Firestore not initialized yet. Attempting to initialize...');
    firebaseFirestore = firestore();
  }
  return firebaseFirestore;
};

export const getStorage = () => {
  if (!firebaseStorage) {
    console.warn('Firebase Storage not initialized yet. Attempting to initialize...');
    firebaseStorage = storage();
  }
  return firebaseStorage;
};

export const getMessaging = () => {
  if (!firebaseMessaging) {
    console.warn('Firebase Messaging not initialized yet. Attempting to initialize...');
    firebaseMessaging = messaging();
  }
  return firebaseMessaging;
};

// Export initialized instances
export { firebaseAuth as auth, firebaseFirestore as firestore, firebaseStorage as storage, firebaseMessaging as messaging };