import { logger } from 'firebase-functions';
import ServiceFactory from '../../web/services/serviceFactory';
import { SILENT_LOCATION_UPDATE_TOPIC } from '../../constants';

const silentNotificationScheduler = async (context) => {
  logger.info('Initializing silent notification handler.');
  const factory = new ServiceFactory('rdb', context);

  try {
    await factory.getNotificationService().sendSilentNotificationToTopic(
      SILENT_LOCATION_UPDATE_TOPIC,
    );
  } catch (err) {
    logger.error('An error occured when sending topic notification', err);
    throw err;
  }
};

export default silentNotificationScheduler;
