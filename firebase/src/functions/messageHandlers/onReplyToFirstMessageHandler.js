
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

      console.log(`Processing message from ${senderId} to ${receiverId} in chat ${chatId}`);

      // Get all messages in this chat to check if this is a reply to first message
      const messagesRef = firestore.collection('chats').doc(chatId).collection('messages');
      const messagesQuery = await messagesRef.orderBy('createdAt', 'asc').get();
      
      let firstMessageSender = null;
      let isSecondMessage = false;
      
      if (messagesQuery.size === 2) {
        // This is the second message
        const firstMessage = messagesQuery.docs[0].data();
        const secondMessage = messagesQuery.docs[1].data();
        
        if (firstMessage.senderId !== secondMessage.senderId) {
          // This is a reply to the first message
          firstMessageSender = firstMessage.senderId;
          isSecondMessage = true;
          console.log(`This is a reply to first message. Original sender: ${firstMessageSender}, Replier: ${senderId}`);
        }
      }

      if (isSecondMessage) {
        // Check if there's a pending connection request between these users
        const requestsRef = firestore.collection('connectionRequests');
        
        // Look for pending request from first message sender to replier
        const requestQuery = await requestsRef
          .where('fromUserId', '==', firstMessageSender)
          .where('toUserId', '==', senderId)
          .where('status', '==', 'pending')
          .get();

        if (!requestQuery.empty) {
          const requestDoc = requestQuery.docs[0];
          
          // Create connection
          const connectionData = {
            participants: [senderId, receiverId],
            connectedAt: new Date(),
            createdBy: 'reply_to_first_message',
            chatId: chatId
          };
          
          await firestore.collection('connections').add(connectionData);
          
          // Update request status to accepted instead of deleting
          await requestDoc.ref.update({
            status: 'accepted',
            acceptedAt: new Date(),
            repliedToFirstMessage: true
          });

          // Update chat document to mark as connected
          await firestore.collection('chats').doc(chatId).set({
            participants: [senderId, receiverId],
            lastMessageTime: messageData.createdAt,
            isConnected: true,
            connectedAt: new Date()
          }, { merge: true });

          console.log(`Connection created between ${senderId} and ${receiverId}`);
        } else {
          console.log('No pending request found for this reply');
        }
      }
    } catch (error) {
      console.error('Error handling reply to first message:', error);
    }
  }
);
