/* eslint-disable prefer-spread */
import { logger } from 'firebase-functions';
import firestore from '../../firestore';
import logFirestoreQuery from '../../helpers/firestoreLogger';
import {
  notificationActionType, notificationType,
} from '../../constants';
import ServiceFactory from '../../web/services/serviceFactory';

const onNewMessage = async (snap, context) => {
  logger.log(`Sending message from user: ${snap.data().sender_id} in thread: ${context.params.threadId}`);
  const { Timestamp: timestamp } = firestore.ref;
  const messageData = snap.data();
  const senderId = messageData.sender_id;
  const factory = new ServiceFactory('rdb', context);

  logFirestoreQuery(`/users/${senderId}`);
  const sender = await firestore.db.doc(`/users/${senderId}`).get();

  await snap.ref.update({ delivered: timestamp.now() });
  const parentThread = await snap.ref.parent.parent.get();

  const promises = [];
  const receivers = parentThread.data().users.filter((userId) => userId !== senderId);
  logger.info(`All receivers: ${receivers}`);

  const settingsPromises = receivers.map(
    (rId) => factory.getNotificationService().checkForNotificationSendingFs(rId),
  );
  const settingsResults = await Promise.all(settingsPromises);

  const allowedReceivers = receivers.filter(
    (receiver, index) => receiver && settingsResults[index],
  );
  logger.info(`Message receivers: ${allowedReceivers}`);
  allowedReceivers.forEach((userId) => {
    if (userId !== senderId) {
      logFirestoreQuery(`/users/${userId}/notifTokens`);
      promises.push(
        firestore.db.collection(`/users/${userId}/notifTokens`).get(),
      );
    }
  });

  const payload = {
    notification: {
      title: sender.data().name,
      body: messageData.content,
      click_action: notificationActionType.FLUTTER_CLICK,
      tag: context.params.threadId,
    },
    data: {
      type: notificationType.NEW_MESSAGE,
      threadId: context.params.threadId,
      userId: senderId,
    },
  };

  const result = await Promise.all(promises);

  const docs = [];
  result.forEach((query) => {
    docs.push(query.docs);
  });
  const merged = [].concat.apply([], docs);

  if (allowedReceivers.length > 0) {
    await factory.getNotificationService().sendNotificationFs(
      merged,
      payload,
    );
  }
};

export default onNewMessage;
