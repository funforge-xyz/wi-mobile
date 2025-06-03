import { logger } from 'firebase-functions';
import firestore from '../firestore';

const syncNotification = async (notificationDoc, docBody) => {
  const body = {
    ...docBody,
    createdAt: firestore.ref.Timestamp.now(),
    open: null,
    read: null,
  };
  logger.info('Inserting notification record');

  try {
    await notificationDoc.set(body);
  } catch (error) {
    logger.info(`An error occured while inserting notification: ${error}`);
  }
};

// Potentially add another fields
const prepareNotificationBody = (
  creatorUserId,
  targetUserId,
  title,
  body,
  data,
) => ({
  creatorUserId,
  targetUserId,
  title,
  body,
  data,
});

export {
  syncNotification,
  prepareNotificationBody,
};
