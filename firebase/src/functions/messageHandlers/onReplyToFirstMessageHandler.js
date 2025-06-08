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
      // The original request would be from the person who sent the first message
      const requestsRef = firestore.collection('connectionRequests');
      const requestQuery = await requestsRef
        .where('fromUserId', '==', receiverId)
        .where('toUserId', '==', senderId)
        .where('status', '==', 'pending')
        .get();

      // Also check the reverse direction in case the reply is from the original requester
      const reverseRequestQuery = await requestsRef
        .where('fromUserId', '==', senderId)
        .where('toUserId', '==', receiverId)
        .where('status', '==', 'pending')
        .get();

      const pendingRequest = !requestQuery.empty ? requestQuery.docs[0] : 
                            !reverseRequestQuery.empty ? reverseRequestQuery.docs[0] : null;

      if (pendingRequest) {
        // Create connection
        await firestore.collection('connections').add({
          participants: [senderId, receiverId],
          connectedAt: new Date(),
          createdBy: 'reply_to_first_message'
        });

        // Update request status to accepted instead of deleting
        await pendingRequest.ref.update({
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