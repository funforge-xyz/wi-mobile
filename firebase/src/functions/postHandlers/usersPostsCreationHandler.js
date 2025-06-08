import { logger } from 'firebase-functions';
import { documentType, syncAction } from '../../constants';
import ServiceFactory from '../../web/services/serviceFactory';
import { registerFailedSync } from '../../helpers/failedSyncRegistration';

const createInitialUsersPostsHandler = async (snap, context) => {
  logger.info(
    `Creating post in DB for document: ${context.params.postId}`,
  );
  const currentData = snap.data();
  const postInsertBody = {
    externalPostId: context.params.postId,
    externalAuthorId: currentData.authorId,
    imageUrl: currentData.thumbURL || currentData.mediaURL,
  };
  const factory = new ServiceFactory('rdb', context);
  const postObj = await factory
    .getPostsService()
    .getPostByExternalId(context.params.postId);

  if (postObj) {
    return;
  }

  try {
    await factory.getPostsService().createPost(postInsertBody);
  } catch (ex) {
    logger.error('An error occured while syncing posts in db: ', ex);
    await registerFailedSync(
      syncAction.CREATE,
      documentType.POST,
      context.params.postId,
      postInsertBody,
    );
  }
};

export default createInitialUsersPostsHandler;
