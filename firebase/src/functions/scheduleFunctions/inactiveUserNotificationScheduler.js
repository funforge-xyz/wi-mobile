import { logger } from 'firebase-functions';
import ServiceFactory from '../../web/services/serviceFactory';

const inactiveUserNotificationScheduler = async (context) => {
  logger.info('Initializing inactive user notification handler.');
  const factory = new ServiceFactory('rdb', context);

  try {
    await factory.getNotificationService().sendInactiveUserNotification();
  } catch (err) {
    logger.error('An error occured while executing inactive user notification handler', err);
    throw err;
  }
};

export default inactiveUserNotificationScheduler;
