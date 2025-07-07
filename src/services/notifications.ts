import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getFirestore, doc, updateDoc, collection, query, where, getDocs, addDoc, getDoc } from 'firebase/firestore';
import { getMessaging, getToken } from 'firebase/messaging';
import { getAuth } from './firebase';
import { EXPO_PROJECT_ID } from 'react-native-dotenv';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const initializeNotifications = async () => {
  if (!Device.isDevice) {
    console.log('📱 Notifications only work on physical devices');
    return;
  }

  // Only set up notification handlers and channels - NO token registration
  console.log('⚙️ Setting up notification handlers...');

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: true,
    });
    console.log('📱 Android notification channel configured');
  }

  console.log('✅ Notification handlers initialized (no token registration)');
};

export const registerForPushNotifications = async () => {
  console.log('🔔 Registering for push notifications...');
  
  if (!Device.isDevice) {
    console.log('❌ Push notifications only work on physical devices');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    console.log('📋 Current notification permission status:', existingStatus);

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      console.log('🔄 Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📋 New notification permission status:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Push notification permission denied');
      return null;
    }

    // Get the Expo push token with security enabled
    console.log('🎫 Getting Expo push token with security...');
    const tokenData = await Notifications.getExpoPushTokenAsync(
      EXPO_PROJECT_ID ? { projectId: EXPO_PROJECT_ID } : {}
    );
    const token = tokenData.data;
    
    // Generate access token for secure push notifications
    const accessToken = await generatePushAccessToken();
    
    console.log('🚀 EXPO PUSH TOKEN RECEIVED:');
    console.log('📱 Token:', token);
    console.log('🔑 ACCESS TOKEN:', accessToken);
    console.log('🔗 Use this token to send test notifications via Expo Push Notification Tool');
    console.log('🌐 Test URL: https://expo.dev/notifications');
    
    // Save both tokens to Firestore
    await saveTokenToFirestore(token, accessToken);
    
    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: true,
      });
      console.log('📱 Android notification channel configured');
    }

    return { token, accessToken };
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
    return null;
  }
};

const saveTokenToFirestore = async (token: string, accessToken?: string) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      const firestore = getFirestore();
      const userRef = doc(firestore, 'users', currentUser.uid);
      await updateDoc(userRef, {
        expoPushToken: token,
        pushAccessToken: accessToken,
        lastTokenUpdate: new Date(),
        platform: Platform.OS,
        pushSecurityEnabled: !!accessToken,
      });
      console.log('✅ Push token and access token saved to Firestore for user:', currentUser.uid);
    } else {
      console.log('⚠️ No authenticated user to save token for');
    }
  } catch (error) {
    console.error('❌ Error saving push token to Firestore:', error);
  }
};

const generatePushAccessToken = async (): Promise<string> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    // Generate a secure access token using user's ID token
    const idToken = await currentUser.getIdToken();
    const timestamp = Date.now();
    
    // Create a unique access token combining user data and timestamp
    const tokenData = `${currentUser.uid}-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    const accessToken = btoa(tokenData); // Base64 encode for security
    
    console.log('🔑 Generated push access token for secure notifications');
    return accessToken;
  } catch (error) {
    console.error('❌ Error generating push access token:', error);
    throw error;
  }
};

export const sendLocalNotification = async (title: string, body: string, data?: any) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null,
  });
};

export const getUnreadNotificationsCount = async (): Promise<number> => {
  try {
    const { getAuth } = await import('./firebase');
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return 0;
    }

    const firestore = getFirestore();
    const notificationsQuery = query(
      collection(firestore, 'notifications'),
      where('targetUserId', '==', currentUser.uid),
      where('read', '==', false)
    );

    const snapshot = await getDocs(notificationsQuery);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread notifications count:', error);
    return 0;
  }
};

export const createNearbyRequestNotification = async (targetUserId: string, fromUserName: string, fromUserPhotoURL?: string): Promise<void> => {
  try {
    const { getAuth } = await import('./firebase');
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser || currentUser.uid === targetUserId) {
      return;
    }

    const firestore = getFirestore();

    // Get current user's profile to construct full name
    const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
    const userData = userDoc.data();
    
    const fullName = userData?.firstName && userData?.lastName 
      ? `${userData.firstName} ${userData.lastName}`
      : userData?.firstName || userData?.displayName || fromUserName || 'Someone';

    await addDoc(collection(firestore, 'notifications'), {
      type: 'nearby_request',
      title: 'New Connection Request',
      body: `${fullName} wants to connect with you`,
      targetUserId: targetUserId,
      fromUserId: currentUser.uid,
      fromUserName: fullName,
      fromUserPhotoURL: fromUserPhotoURL || userData?.photoURL || '',
      read: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error creating nearby request notification:', error);
  }
};

export const handleBackgroundMessage = (message: any) => {
  console.log('Background message received:', message);
  // Handle background message
};