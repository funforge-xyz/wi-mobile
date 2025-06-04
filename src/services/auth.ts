import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  // GoogleAuthProvider,
  // signInWithCredential,
} from 'firebase/auth';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getAuth } from './firebase';
import { Credentials } from './storage';

export class AuthService {
  private credentials = new Credentials();
  private onSignOutCallback?: () => void;

  constructor() {
    // TODO: Google Sign In configuration disabled for Expo Go compatibility
    // GoogleSignin.configure({
    //   webClientId: 'your-web-client-id', // Add your actual web client ID
    // });
  }

  async signInWithEmail(email: string, password: string): Promise<FirebaseUser | null> {
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        const token = await user.getIdToken();
        await this.credentials.setToken(token);
        await this.credentials.setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      }

      return user;
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    }
  }

  async updateProfile(userData: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    photoURL?: string;
  }): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Update Firebase Auth profile if displayName or photoURL changed
      const displayName = userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}` 
        : user.displayName;

      if (displayName !== user.displayName || userData.photoURL !== user.photoURL) {
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(user, {
          displayName: displayName || undefined,
          photoURL: userData.photoURL || undefined,
        });
      }

      // Update Firestore profile document
      const { getFirestore } = await import('./firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'users', user.uid);
      
      await setDoc(userDocRef, {
        email: user.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        displayName: displayName || '',
        bio: userData.bio || '',
        photoURL: userData.photoURL || '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Update local storage
      await this.credentials.setUser({
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: userData.photoURL || user.photoURL,
      });

    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  async signUpWithEmail(email: string, password: string): Promise<FirebaseUser | null> {
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        const token = await user.getIdToken();
        await this.credentials.setToken(token);
        await this.credentials.setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      }

      return user;
    } catch (error) {
      console.error('Email sign up error:', error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<FirebaseUser | null> {
    // TODO: Google Sign In not working with Expo Go - temporarily disabled
    throw new Error('Google Sign In is temporarily disabled in development');

    // try {
    //   await GoogleSignin.hasPlayServices();
    //   const { idToken } = await GoogleSignin.signIn();
    //   
    //   const googleCredential = GoogleAuthProvider.credential(idToken);
    //   const userCredential = await signInWithCredential(auth, googleCredential);
    //   const user = userCredential.user;
    //   
    //   if (user) {
    //     const token = await user.getIdToken();
    //     await this.credentials.setToken(token);
    //     await this.credentials.setUser({
    //       uid: user.uid,
    //       email: user.email,
    //       displayName: user.displayName,
    //       photoURL: user.photoURL,
    //     });
    //   }
    //   
    //   return user;
    // } catch (error) {
    //   console.error('Google sign in error:', error);
    //   throw error;
    // }
  }

  setOnSignOutCallback(callback: () => void) {
    this.onSignOutCallback = callback;
  }

  async signOut(): Promise<void> {
    try {
      const auth = getAuth();
      await firebaseSignOut(auth);
      await this.credentials.removeToken();
      await this.credentials.removeUser();
      // TODO: Google Sign In calls disabled for Expo Go compatibility
      // await GoogleSignin.revokeAccess();
      // await GoogleSignin.signOut();
      
      // Trigger navigation reset
      if (this.onSignOutCallback) {
        this.onSignOutCallback();
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<any> {
    return await this.credentials.getUser();
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.credentials.getToken();
    return !!token;
  }
}

export const authService = new AuthService();