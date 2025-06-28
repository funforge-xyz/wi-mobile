import { logger } from 'firebase-functions';
import ServiceFactory from '../../web/services/serviceFactory';

const commentAndLikeNotificationHandler = async (context) => {
  logger.info('Initializing summary notification handler.');
  const factory = new ServiceFactory('rdb', context);

  try {
    await factory.getCommentLikeSummaryDetailService().sendCommentLikeSummaryNotifications();
  } catch (err) {
    logger.error('An error occured while executing summary notification handler.', err);
    throw err;
  }
};

export default commentAndLikeNotificationHandler;
