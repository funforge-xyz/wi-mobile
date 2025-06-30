import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getFirestore, doc, updateDoc, collection, query, where, getDocs, addDoc, getDoc } from 'firebase/firestore';
import { getAuth } from './firebase';

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

    // Get the Expo push token
    console.log('🎫 Getting Expo push token...');
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    
    console.log('🚀 EXPO PUSH TOKEN RECEIVED:');
    console.log('📱 Token:', token);
    console.log('🔗 Use this token to send test notifications via Expo Push Notification Tool');
    console.log('🌐 Test URL: https://expo.dev/notifications');
    
    // Save token to Firestore
    await saveTokenToFirestore(token);
    
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

    return token;
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
    return null;
  }
};

const saveTokenToFirestore = async (token: string) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      const firestore = getFirestore();
      const userRef = doc(firestore, 'users', currentUser.uid);
      await updateDoc(userRef, {
        expoPushToken: token,
        lastTokenUpdate: new Date(),
        platform: Platform.OS,
      });
      console.log('✅ Push token saved to Firestore for user:', currentUser.uid);
    } else {
      console.log('⚠️ No authenticated user to save token for');
    }
  } catch (error) {
    console.error('❌ Error saving push token to Firestore:', error);
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