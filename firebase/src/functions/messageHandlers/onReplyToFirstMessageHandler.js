
import { logger } from 'firebase-functions';

export const createConnectionOnReply = async (snap, context, firestore) => {
  try {
    const messageData = snap.data();
    const { senderId, receiverId } = messageData;

    // Check if this is a reply to a connection request
    const connectionRequestsRef = firestore.collection('connectionRequests');
    const pendingRequestQuery = connectionRequestsRef
      .where('fromUserId', '==', receiverId)
      .where('toUserId', '==', senderId)
      .where('status', '==', 'pending')
      .where('firstMessageSent', '==', true);

    const pendingRequestSnapshot = await pendingRequestQuery.get();

    if (!pendingRequestSnapshot.empty) {
      const requestDoc = pendingRequestSnapshot.docs[0];
      
      // Create connection
      await firestore.collection('connections').add({
        participants: [senderId, receiverId],
        connectedAt: new Date(),
        createdAt: new Date(),
      });

      // Update request status to accepted
      await requestDoc.ref.update({
        status: 'accepted',
        updatedAt: new Date(),
      });

      logger.info(`Connection created between ${senderId} and ${receiverId}`);
    }
  } catch (error) {
    logger.error('Error creating connection on reply:', error);
  }
};
