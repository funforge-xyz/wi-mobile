import { logger } from 'firebase-functions';
import { documentType, syncAction } from '../../constants';
import ServiceFactory from '../../web/services/serviceFactory';
import { registerFailedSync } from '../../helpers/failedSyncRegistration';

const onUpdateUserHandler = async (snap, context) => {
  logger.info(
    `Updating user in DB for document: ${context.params.userId}`,
  );
  const afterData = snap.after.data();
  const beforeData = snap.before.data();

  const userUpdateBody = {
    ...(afterData.name !== beforeData.name ? { name: afterData.name } : {}),
    ...(afterData.phone !== beforeData.phone ? { phone: afterData.phone } : {}),
    ...(afterData.email !== beforeData.email ? { email: afterData.email } : {}),
    ...(afterData.currentNetworkId !== beforeData.currentNetworkId
      ? { currentNetworkId: afterData.currentNetworkId } : {}),
    ...(afterData.about !== beforeData.about ? { about: afterData.about } : {}),
    ...(afterData.imageUrl !== beforeData.imageUrl
      ? { imageUrl: afterData.imageUrl } : {}),
    ...((afterData?.userActivityStatus?.lastTimeSeen
      && afterData.userActivityStatus?.lastTimeSeen !== beforeData.userActivityStatus?.lastTimeSeen)
      ? {
        lastTimeSeen: afterData.userActivityStatus.lastTimeSeen.toDate(),
      } : {}),
  };

  logger.info(`User Update Body: ${userUpdateBody}`);

  try {
    if (Object.keys(userUpdateBody).length > 0) {
      const factory = new ServiceFactory('rdb', context);
      await factory.getUserService().updateUserByExternalId(
        context.params.userId,
        userUpdateBody,
      );
    }
  } catch (ex) {
    logger.error('An error occured while syncing users in db:', ex);
    await registerFailedSync(
      syncAction.UPDATE,
      documentType.USER,
      context.params.userId,
      userUpdateBody,
    );
  }
};

export default onUpdateUserHandler;
