import * as functions from 'firebase-functions';
import summarizeAndNotifyOnLikeCreateHandler from './sendLikeInitialNotification';
import likesOnDeleteHandler from './likesOnDeleteHandler';

const likesOnDeleteFunction = functions
  .region('europe-west1')
  .firestore.document('/posts/{postId}/likes/{likeId}')
  .onDelete(likesOnDeleteHandler);

const summarizeAndNotifyOnLikeCreateFunction = functions
  .region('europe-west1')
  .firestore.document('/posts/{postId}/likes/{likeId}')
  .onCreate(summarizeAndNotifyOnLikeCreateHandler);

export default {
  likesOnDeleteFunction,
  summarizeAndNotifyOnLikeCreateFunction,
};
