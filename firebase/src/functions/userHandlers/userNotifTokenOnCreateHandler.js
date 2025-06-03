import { logger } from 'firebase-functions';
import firestore from '../../firestore';
import logFirestoreQuery from '../../helpers/firestoreLogger';
import ServiceFactory from '../../web/services/serviceFactory';
import { documentType, SILENT_LOCATION_UPDATE_TOPIC, syncAction } from '../../constants';
import { registerFailedSync } from '../../helpers/failedSyncRegistration';

const userNotifTokenOnCreateHandler = async (snap, context) => {
  logger.info(
    `Creating notifToken in DB for user: ${context.params.userId}, notifToken document: ${context.params.notifTokenId}`,
  );
  const currentData = snap.data();
  const userNotifTokenBody = {
    notifToken: currentData.token,
  };
  let tokenSyncedToDb = false;
  const factory = new ServiceFactory('rdb', context);

  try {
    // Syncing notif token to the db
    await factory.getUserService().updateUserNotifToken(
      context.params.userId,
      userNotifTokenBody,
    );
    tokenSyncedToDb = true;
  } catch (ex) {
    logger.error('An error occured while syncing users notifToken in db:', ex);
    await registerFailedSync(
      syncAction.CREATE,
      documentType.NOTIF_TOKEN,
      context.params.notifTokenId,
      {
        ...userNotifTokenBody,
        userId: context.params.userId,
      },
    );
  }

  if (tokenSyncedToDb) {
    await factory.getNotificationService().subscribeUserTokenOnTopic(
      currentData.token, SILENT_LOCATION_UPDATE_TOPIC,
    );
    // Handle unsubscribe action of old token, after token update
  }

  logFirestoreQuery('notifTokens');
  const batch = firestore.db.batch();
  const tokenRefs = await snap.ref.parent.parent.collection('notifTokens').get();
  tokenRefs.forEach((doc) => {
    if (doc.id !== context.params.notifTokenId) {
      batch.delete(doc.ref);
    }
  });

  await batch.commit();
};

export default userNotifTokenOnCreateHandler;
