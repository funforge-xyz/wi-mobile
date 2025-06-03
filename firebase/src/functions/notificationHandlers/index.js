import * as functions from 'firebase-functions';
import notificationOnCreateHandler from './notificationOnCreateHandler';
import notificationOnUpdateHandler from './notificationOnUpdateHandler';

const syncOnNotificationCreateFunction = functions
  .region('europe-west1')
  .firestore.document('/notifications/{notificationId}')
  .onCreate(notificationOnCreateHandler);

const syncOnNotificationUpdateFunction = functions
  .region('europe-west1')
  .firestore.document('/notifications/{notificationId}')
  .onUpdate(notificationOnUpdateHandler);


export default {
  syncOnNotificationCreateFunction,
  syncOnNotificationUpdateFunction,
};
