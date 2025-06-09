
const admin = require('firebase-admin');
const { sendPushNotification } = require('./pushNotifications');

const createLikeNotification = async (postId, fromUserId, targetUserId) => {
  try {
    // Get user info for the notification
    const fromUserDoc = await admin.firestore()
      .collection('users')
      .doc(fromUserId)
      .get();

    if (!fromUserDoc.exists) return;

    const fromUser = fromUserDoc.data();
    
    // Create notification document
    const notificationRef = admin.firestore().collection('notifications').doc();
    
    const notificationData = {
      id: notificationRef.id,
      type: 'like',
      title: 'New Like',
      body: `${fromUser.firstName || 'Someone'} liked your post`,
      postId: postId,
      fromUserId: fromUserId,
      fromUserName: fromUser.firstName || 'Unknown',
      fromUserPhotoURL: fromUser.photoURL || '',
      targetUserId: targetUserId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    };

    await notificationRef.set(notificationData);
    
    return notificationRef.id;
  } catch (error) {
    console.error('Error creating like notification:', error);
    throw error;
  }
};

const createCommentNotification = async (postId, commentId, fromUserId, targetUserId, commentText) => {
  try {
    // Get user info for the notification
    const fromUserDoc = await admin.firestore()
      .collection('users')
      .doc(fromUserId)
      .get();

    if (!fromUserDoc.exists) return;

    const fromUser = fromUserDoc.data();
    
    // Create notification document
    const notificationRef = admin.firestore().collection('notifications').doc();
    
    const notificationData = {
      id: notificationRef.id,
      type: 'comment',
      title: 'New Comment',
      body: `${fromUser.firstName || 'Someone'} commented on your post`,
      postId: postId,
      commentId: commentId,
      fromUserId: fromUserId,
      fromUserName: fromUser.firstName || 'Unknown',
      fromUserPhotoURL: fromUser.photoURL || '',
      targetUserId: targetUserId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    };

    await notificationRef.set(notificationData);
    
    return notificationRef.id;
  } catch (error) {
    console.error('Error creating comment notification:', error);
    throw error;
  }
};

const createNearbyRequestNotification = async (fromUserId, targetUserId) => {
  try {
    // Get user info for the notification
    const fromUserDoc = await admin.firestore()
      .collection('users')
      .doc(fromUserId)
      .get();

    if (!fromUserDoc.exists) return;

    const fromUser = fromUserDoc.data();
    
    // Create notification document
    const notificationRef = admin.firestore().collection('notifications').doc();
    
    const notificationData = {
      id: notificationRef.id,
      type: 'nearby_request',
      title: 'New Connection Request',
      body: `${fromUser.firstName || 'Someone'} wants to connect with you`,
      fromUserId: fromUserId,
      fromUserName: fromUser.firstName || 'Unknown',
      fromUserPhotoURL: fromUser.photoURL || '',
      targetUserId: targetUserId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    };

    await notificationRef.set(notificationData);
    
    return notificationRef.id;
  } catch (error) {
    console.error('Error creating nearby request notification:', error);
    throw error;
  }
};

module.exports = {
  createLikeNotification,
  createCommentNotification,
  createNearbyRequestNotification,
};
