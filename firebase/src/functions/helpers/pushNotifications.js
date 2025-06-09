
const admin = require('firebase-admin');

const sendPushNotification = async (targetUserId, title, body, data = {}) => {
  try {
    // Get user's push token from Firestore
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(targetUserId)
      .get();

    if (!userDoc.exists || !userDoc.data().expoPushToken) {
      console.log('No push token found for user:', targetUserId);
      return;
    }

    const pushToken = userDoc.data().expoPushToken;

    // Send notification using Expo's push service
    const message = {
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Push notification sent:', result);
    return result;

  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

module.exports = {
  sendPushNotification,
};
