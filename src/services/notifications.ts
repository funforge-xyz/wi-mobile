
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
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
    console.log('Notifications only work on physical devices');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Push notification token:', token);

  // Save token to Firestore for the current user
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      const firestore = getFirestore();
      const userRef = doc(firestore, 'users', currentUser.uid);
      await updateDoc(userRef, {
        expoPushToken: token,
        lastTokenUpdate: new Date(),
      });
      console.log('Push token saved to Firestore');
    }
  } catch (error) {
    console.error('Error saving push token:', error);
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
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

export const handleBackgroundMessage = (message: any) => {
  console.log('Background message received:', message);
  // Handle background message
};
