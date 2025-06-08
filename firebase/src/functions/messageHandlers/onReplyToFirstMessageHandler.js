
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
      
      // Check if this is exactly the second message and it's a reply
      if (messagesQuery.size === 2) {
        const firstMessage = messagesQuery.docs[0].data();
        const secondMessage = messagesQuery.docs[1].data();
        
        // Verify this is a reply (different senders)
        if (firstMessage.senderId !== secondMessage.senderId) {
          const firstMessageSender = firstMessage.senderId;
          const replySender = secondMessage.senderId;
          
          console.log(`Reply detected: Original sender: ${firstMessageSender}, Replier: ${replySender}`);

          // Look for pending request from first message sender to replier
          const requestsRef = firestore.collection('connectionRequests');
          const requestQuery = await requestsRef
            .where('fromUserId', '==', firstMessageSender)
            .where('toUserId', '==', replySender)
            .where('status', '==', 'pending')
            .get();

          if (!requestQuery.empty) {
            const requestDoc = requestQuery.docs[0];
            const batch = firestore.batch();
            
            // Create connection
            const connectionRef = firestore.collection('connections').doc();
            batch.set(connectionRef, {
              participants: [firstMessageSender, replySender],
              connectedAt: new Date(),
              createdBy: 'reply_to_first_message',
              chatId: chatId,
              status: 'active'
            });
            
            // Update request status to accepted
            batch.update(requestDoc.ref, {
              status: 'accepted',
              acceptedAt: new Date(),
              repliedToFirstMessage: true,
              connectionId: connectionRef.id
            });

            // Update chat document to mark as connected
            const chatRef = firestore.collection('chats').doc(chatId);
            batch.update(chatRef, {
              isConnected: true,
              connectedAt: new Date(),
              connectionId: connectionRef.id
            });

            // Execute all updates atomically
            await batch.commit();

            console.log(`Connection created between ${firstMessageSender} and ${replySender} with ID: ${connectionRef.id}`);
          } else {
            console.log('No pending request found for this reply');
          }
        }
      }
    } catch (error) {
      console.error('Error handling reply to first message:', error);
    }
  }
);
