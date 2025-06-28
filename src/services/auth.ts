import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  // GoogleAuthProvider,
  // signInWithCredential,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  reload,
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
        // Reload user to get latest emailVerified status
        await reload(user);

        // Check if email is verified
        if (!user.emailVerified) {
          // Sign out the user since email is not verified
          await firebaseSignOut(auth);
          throw new Error('email-not-verified');
        }

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

  async updateProfile(profileData: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    photoURL?: string;
    thumbnailURL?: string;
  }): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('No authenticated user');
      }

      // Update Firebase Auth profile if displayName or photoURL changed
      const displayName = profileData.firstName && profileData.lastName 
        ? `${profileData.firstName} ${profileData.lastName}` 
        : user.displayName;

      if (displayName !== user.displayName || profileData.photoURL !== user.photoURL) {
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(user, {
          displayName: displayName || undefined,
          photoURL: profileData.photoURL || undefined,
        });
      }

      // Update Firestore profile document
      const { getFirestore } = await import('./firebase');
      const { doc, setDoc } = await import('firebase/firestore');

      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'users', user.uid);

      await setDoc(userDocRef, {
        email: user.email,
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        bio: profileData.bio || '',
        photoURL: profileData.photoURL || '',
        thumbnailURL: profileData.thumbnailURL || '', // Store thumbnail URL
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Update local storage
      await this.credentials.setUser({
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: profileData.photoURL || user.photoURL,
      });

    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  async signUpWithEmail(email: string, password: string, profileData?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    photoURL?: { fullUrl: string; thumbnailUrl: string; } | string;
    thumbnailURL?: string;
  }): Promise<FirebaseUser | null> {
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        // Send email verification before creating user document
        await sendEmailVerification(user);

        // Create user document in Firestore
        const { getFirestore } = await import('./firebase');
        const { doc, setDoc } = await import('firebase/firestore');

        const firestore = getFirestore();
        const userDocRef = doc(firestore, 'users', user.uid);

        await setDoc(userDocRef, {
          email: user.email,
          firstName: profileData?.firstName || '',
          lastName: profileData?.lastName || '',
          bio: profileData?.bio || '',
          photoURL: profileData?.photoURL || user.photoURL || '',
          thumbnailURL: profileData?.thumbnailURL || '',
          trackingRadius: 1000, // Default 1km in meters
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Update Firebase Auth displayName if first and last names are provided
        if (profileData?.firstName && profileData?.lastName) {
          const { updateProfile } = await import('firebase/auth');
          await updateProfile(user, {
            displayName: `${profileData.firstName} ${profileData.lastName}`,
          });
        }

        // Sign out the user after signup so they must verify email before signing in
        await firebaseSignOut(auth);
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

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No user found');
      }

      // Re-authenticate user with current password
      const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      const { updatePassword } = await import('firebase/auth');
      await updatePassword(user, newPassword);

      console.log('Password changed successfully');
    } catch (error: any) {
      console.error('Error changing password:', error);

      if (error.code === 'auth/wrong-password') {
        throw new Error('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('New password is too weak');
      } else if (error.code === 'auth/requires-recent-login') {
        throw new Error('For security reasons, please sign out and sign back in before changing your password');
      }

      throw new Error('Failed to change password. Please try again.');
    }
  }

  async resendVerificationEmail(): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('No authenticated user');
      }

      if (user.emailVerified) {
        throw new Error('Email is already verified');
      }

      await sendEmailVerification(user);
    } catch (error) {
      console.error('Resend verification email error:', error);
      throw error;
    }
  }

  async deleteProfile(): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('No authenticated user');
      }

      // Check if re-authentication is needed
      try {
        // Get user data to find profile picture URL
        const { getFirestore } = await import('./firebase');
        const { doc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch } = await import('firebase/firestore');

        const firestore = getFirestore();
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        // Delete profile picture from storage if it exists
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.photoURL && userData.photoURL.includes('firebase')) {
            try {
              const { storageService } = await import('./storage');
              await storageService.deleteProfilePicture(userData.photoURL);
            } catch (storageError) {
              console.error('Error deleting profile picture:', storageError);
              // Continue with profile deletion even if image deletion fails
            }
          }
        }

        // Use batched writes for better performance
        const batch = writeBatch(firestore);

        // 1. Delete all user's posts and their associated data
        const postsQuery = query(
          collection(firestore, 'posts'),
          where('authorId', '==', user.uid)
        );
        const postsSnapshot = await getDocs(postsQuery);

        for (const postDoc of postsSnapshot.docs) {
          // Delete all comments for this post
          const commentsQuery = query(
            collection(firestore, 'posts', postDoc.id, 'comments')
          );
          const commentsSnapshot = await getDocs(commentsQuery);
          commentsSnapshot.forEach((commentDoc) => {
            batch.delete(commentDoc.ref);
          });

          // Delete all likes for this post
          const likesQuery = query(
            collection(firestore, 'posts', postDoc.id, 'likes')
          );
          const likesSnapshot = await getDocs(likesQuery);
          likesSnapshot.forEach((likeDoc) => {
            batch.delete(likeDoc.ref);
          });

          // Delete the post itself
          batch.delete(postDoc.ref);
        }

        // 2. Delete all comments made by this user on other posts
        const allPostsQuery = query(collection(firestore, 'posts'));
        const allPostsSnapshot = await getDocs(allPostsQuery);

        for (const postDoc of allPostsSnapshot.docs) {
          const userCommentsQuery = query(
            collection(firestore, 'posts', postDoc.id, 'comments'),
            where('authorId', '==', user.uid)
          );
          const userCommentsSnapshot = await getDocs(userCommentsQuery);
          userCommentsSnapshot.forEach((commentDoc) => {
            batch.delete(commentDoc.ref);
          });

          // Delete all likes made by this user on other posts
          const userLikesQuery = query(
            collection(firestore, 'posts', postDoc.id, 'likes'),
            where('authorId', '==', user.uid)
          );
          const userLikesSnapshot = await getDocs(userLikesQuery);
          userLikesSnapshot.forEach((likeDoc) => {
            batch.delete(likeDoc.ref);
          });
        }

        // 3. Delete all connections where this user is a participant
        const connectionsQuery = query(
          collection(firestore, 'connections'),
          where('participants', 'array-contains', user.uid)
        );
        const connectionsSnapshot = await getDocs(connectionsQuery);
        connectionsSnapshot.forEach((connectionDoc) => {
          batch.delete(connectionDoc.ref);
        });

        // 4. Delete all connection requests to or from this user
        const outgoingRequestsQuery = query(
          collection(firestore, 'connectionRequests'),
          where('fromUserId', '==', user.uid)
        );
        const outgoingRequestsSnapshot = await getDocs(outgoingRequestsQuery);
        outgoingRequestsSnapshot.forEach((requestDoc) => {
          batch.delete(requestDoc.ref);
        });

        const incomingRequestsQuery = query(
          collection(firestore, 'connectionRequests'),
          where('toUserId', '==', user.uid)
        );
        const incomingRequestsSnapshot = await getDocs(incomingRequestsQuery);
        incomingRequestsSnapshot.forEach((requestDoc) => {
          batch.delete(requestDoc.ref);
        });

        // 5. Delete blocked users records
        const blockedByUserQuery = query(
          collection(firestore, 'blockedUsers'),
          where('blockerUserId', '==', user.uid)
        );
        const blockedByUserSnapshot = await getDocs(blockedByUserQuery);
        blockedByUserSnapshot.forEach((blockedDoc) => {
          batch.delete(blockedDoc.ref);
        });

        const blockedUserQuery = query(
          collection(firestore, 'blockedUsers'),
          where('blockedUserId', '==', user.uid)
        );
        const blockedUserSnapshot = await getDocs(blockedUserQuery);
        blockedUserSnapshot.forEach((blockedDoc) => {
          batch.delete(blockedDoc.ref);
        });

        // 6. Delete user document
        batch.delete(userDocRef);

        // Commit all deletions
        await batch.commit();

        // Delete the Firebase Auth user account (this also frees up the email)
        const { deleteUser } = await import('firebase/auth');
        await deleteUser(user);

        // Clear local storage
        await this.credentials.removeToken();
        await this.credentials.removeUser();

        // Trigger navigation reset to sign in screen
        if (this.onSignOutCallback) {
          this.onSignOutCallback();
        }

      } catch (deleteError: any) {
        // If the error is about recent login, we need to re-authenticate
        if (deleteError.code === 'auth/requires-recent-login') {
          throw new Error('For security reasons, please sign out and sign back in before deleting your account.');
        }
        throw deleteError;
      }

    } catch (error) {
      console.error('Profile deletion error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();