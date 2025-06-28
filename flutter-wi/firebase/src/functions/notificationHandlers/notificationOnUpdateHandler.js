import { logger } from 'firebase-functions';
import {
  documentType, syncAction,
} from '../../constants';
import ServiceFactory from '../../web/services/serviceFactory';
import { registerFailedSync } from '../../helpers/failedSyncRegistration';


const updateNotificationHandler = async (snap, context) => {
  logger.info(
    `Updating notification in DB for document: ${context.params.notificationId}`,
  );
  const afterData = snap.after.data();
  const beforeData = snap.before.data();

  const notificationUpdateBody = {
    ...(afterData.title !== beforeData.title ? { title: afterData.title } : {}),
    ...(afterData.body !== beforeData.body ? { body: afterData.body } : {}),
    ...(afterData.open !== beforeData.open ? { dateOpened: new Date() } : {}),
    ...(afterData.read !== beforeData.read ? { dateRead: new Date() } : {}),
    ...(afterData.data !== beforeData.data
      ? { notificationData: afterData.data } : {}),
  };

  if (Object.keys(notificationUpdateBody).length > 0) {
    try {
      const factory = new ServiceFactory('rdb', context);
      await factory.getNotificationService().updateNotificationEntity(
        context.params.notificationId,
        notificationUpdateBody,
      );
    } catch (ex) {
      logger.error('An error occured while syncing notification in db: ', ex);
      await registerFailedSync(
        syncAction.UPDATE,
        documentType.NOTIFICATION,
        context.params.notificationId,
        notificationUpdateBody,
      );
    }
  }
};

export default updateNotificationHandler;
