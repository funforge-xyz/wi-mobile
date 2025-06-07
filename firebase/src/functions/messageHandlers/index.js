import * as functions from 'firebase-functions';
import onNewMessageHandler from './onNewMessageHandler';

const onNewMessageFunction = functions
  .region('europe-west1')
  .firestore.document('/threads/{threadId}/messages/{messageId}')
  .onCreate(onNewMessageHandler);

export { onNewMessageHandler } from './onNewMessageHandler';
export { createConnectionOnReply } from './onReplyToFirstMessageHandler';

export default {
  onNewMessageFunction,
};