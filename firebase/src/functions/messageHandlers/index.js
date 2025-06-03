import * as functions from 'firebase-functions';
import onNewMessageHandler from './onNewMessageHandler';

const onNewMessageFunction = functions
  .region('europe-west1')
  .firestore.document('/threads/{threadId}/messages/{messageId}')
  .onCreate(onNewMessageHandler);

export default {
  onNewMessageFunction,
};
