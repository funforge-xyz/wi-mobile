import { logger } from 'firebase-functions';
import { documentType, syncAction } from '../../constants';
import ServiceFactory from '../../web/services/serviceFactory';
import { registerFailedSync } from '../../helpers/failedSyncRegistration';

const onCreateUserHandler = async (snap, context) => {
  logger.info(
    `Creating user in DB for document: ${context.params.userId}`,
  );

  const currentData = snap.data();
  const userInsertBody = {
    name: currentData.name || null,
    phone: currentData.phone || null,
    email: currentData.email,
    currentNetworkId: currentData.currentNetworkId || null,
    externalUserId: context.params.userId,
    about: currentData.about || null,
    imageUrl: currentData.imageUrl || null,
    ...(currentData.lastKnownLocation ? {
      lastUpdatedLatitude: currentData.lastKnownLocation.latitude,
      lastUpdatedLongitude: currentData.lastKnownLocation.longitude,
    } : {}),
    ...(currentData.userActivityStatus?.lastTimeSeen ? {
      lastTimeSeen: currentData.userActivityStatus.lastTimeSeen.toDate(),
    } : {}),
  };

  logger.info(`User Insert Body: ${userInsertBody}`);

  try {
    const factory = new ServiceFactory('rdb', context);
    await factory.getUserService().createUser(userInsertBody);
  } catch (ex) {
    logger.error('An error occured while syncing users in db:', ex);
    await registerFailedSync(
      syncAction.CREATE,
      documentType.USER,
      context.params.userId,
      userInsertBody,
    );
  }
};

export default onCreateUserHandler;
