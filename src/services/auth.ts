
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from './firebase';
import { Credentials } from './storage';

export class AuthService {
  private credentials = new Credentials();

  constructor() {
    // Configure Google Sign In
    GoogleSignin.configure({
      webClientId: 'your-web-client-id', // Add your actual web client ID
    });
  }

  async signInWithEmail(email: string, password: string): Promise<FirebaseUser | null> {
    try {
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

  async signUpWithEmail(email: string, password: string): Promise<FirebaseUser | null> {
    try {
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
    try {
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);
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
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      await this.credentials.removeToken();
      await this.credentials.removeUser();
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
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
