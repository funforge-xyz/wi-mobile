import { logger } from 'firebase-functions';
import ServiceFactory from '../../web/services/serviceFactory';

const postsOnDeleteHandler = async (snap, context) => {
  logger.info(`Deleting posts with id: ${context.params.postId}`);

  const factory = new ServiceFactory('rdb', context);
  await factory.getPostsService()
    .deletePostsByExternalId(context.params.postId);
};

export default postsOnDeleteHandler;
