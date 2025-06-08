const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { getFirestore } = require('firebase-admin/firestore');

/**
 * Handles when someone replies to a first message
 * Creates a connection between users and removes the pending request
 */
exports.onReplyToFirstMessage = onDocumentWritten(
  'chats/{chatId}/messages/{messageId}',
  async (event) => {
    const firestore = getFirestore();
    const messageData = event.data?.after?.data();
    const previousMessageData = event.data?.before?.data();

    // Only process new messages (not updates)
    if (!messageData || previousMessageData) {
      return;
    }

    try {
      const chatId = event.params.chatId;
      const senderId = messageData.senderId;
      const receiverId = messageData.receiverId;

      // Check if there's a pending connection request between these users
      // The original request would be from receiverId to senderId
      const requestsRef = firestore.collection('connectionRequests');
      const requestQuery = await requestsRef
        .where('fromUserId', '==', receiverId)
        .where('toUserId', '==', senderId)
        .where('status', '==', 'pending')
        .get();

      if (!requestQuery.empty) {
        const requestDoc = requestQuery.docs[0];

        // Create connection
        await firestore.collection('connections').add({
          participants: [senderId, receiverId],
          connectedAt: new Date(),
          createdBy: 'reply_to_first_message'
        });

        // Update request status to accepted instead of deleting
        await requestDoc.ref.update({
          status: 'accepted',
          acceptedAt: new Date()
        });

        console.log(`Connection created between ${senderId} and ${receiverId}`);
      }
    } catch (error) {
      console.error('Error handling reply to first message:', error);
    }
  }
);