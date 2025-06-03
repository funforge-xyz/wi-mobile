
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  projectId: "wichat-2684e",
  storageBucket: "wichat-2684e.appspot.com",
  apiKey: "your-api-key", // Add your actual API key
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
    auth = getAuth(app);
    firestore = getFirestore(app);
    storage = getStorage(app);
    analytics = getAnalytics(app);
    
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
};

export { auth, firestore, storage, analytics };
export default app;
