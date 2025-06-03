import { logger } from 'firebase-functions';
import {
  documentType, syncAction, notificationType, notificationTypeIndex,
} from '../../constants';
import ServiceFactory from '../../web/services/serviceFactory';
import { registerFailedSync } from '../../helpers/failedSyncRegistration';

const notificationTypeMap = {
  [notificationType.NEW_COMMENT]: notificationTypeIndex.INITIAL_COMMENT,
  [notificationType.NEW_LIKE]: notificationTypeIndex.INITIAL_LIKE,
  [notificationType.COMMENTS_SUMMARY]: notificationTypeIndex.SUMMARY_COMMENT,
  [notificationType.LIKES_SUMMARY]: notificationTypeIndex.SUMMARY_LIKE,
  [notificationType.INACTIVE_USER]: notificationTypeIndex.USER_INACTIVITY,
};

const createNotificationHandler = async (snap, context) => {
  logger.info(
    `Creating notification in DB for document: ${context.params.notificationId}`,
  );
  const currentData = snap.data();

  const notificationInsertBody = {
    externalNotificationId: context.params.notificationId,
    title: currentData.title || null,
    body: currentData.body || null,
    creatorUserExternalId: currentData.creatorUserId || null,
    targetUserExternalId: currentData.targetUserId,
    dateOpened: currentData.open || null,
    dateRead: currentData.read || null,
    notificationData: currentData.data || null,
    notificationTypeId: notificationTypeMap[currentData.data.type],
  };

  const factory = new ServiceFactory('rdb', context);

  try {
    await factory.getNotificationService().createNotificationEntity(notificationInsertBody);
  } catch (ex) {
    logger.error('An error occured while syncing notification in db: ', ex);
    await registerFailedSync(
      syncAction.CREATE,
      documentType.NOTIFICATION,
      context.params.notificationId,
      notificationInsertBody,
    );
  }
};

export default createNotificationHandler;
