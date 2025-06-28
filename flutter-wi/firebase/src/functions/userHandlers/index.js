import * as functions from 'firebase-functions';
import usersOnCreateHandler from './usersOnCreateHandler';
import usersOnUpdateHandler from './usersOnUpdateHandler';
import userNotifTokenOnCreateHandler from './userNotifTokenOnCreateHandler';
import usersSettingsOnWriteHandler from './usersSettingsOnWriteHandler';

const onUserNotifTokenCreateFunction = functions
  .region('europe-west1')
  .firestore.document('/users/{userId}/notifTokens/{notifTokenId}')
  .onCreate(userNotifTokenOnCreateHandler);

const onUpdateUserFunction = functions
  .region('europe-west1')
  .firestore.document('/users/{userId}')
  .onUpdate(usersOnUpdateHandler);

const onCreateUserFunction = functions
  .region('europe-west1')
  .firestore.document('/users/{userId}')
  .onCreate(usersOnCreateHandler);

const onWriteUserSettingsFunction = functions
  .region('europe-west1')
  .firestore.document('/settings/{userId}')
  .onWrite(usersSettingsOnWriteHandler);


export default {
  onCreateUserFunction,
  onUpdateUserFunction,
  onUserNotifTokenCreateFunction,
  onWriteUserSettingsFunction,
};
