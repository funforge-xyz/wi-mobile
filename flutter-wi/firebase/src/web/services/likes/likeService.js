import { logger } from 'firebase-functions';
import ValidationError from '../../utils/validationError';
import validations from './validations/likeServiceValidation';

class LikesService {
  constructor(options) {
    this.repository = options.repository;
    this.context = options.context;
    this.factory = options.factory;
  }

  async createLike(likeObj) {
    await validations.createLike(likeObj);

    const insertObj = { ...likeObj };
    const { externalPostId } = insertObj;

    const postObj = await this.factory
      .getPostsService()
      .getPostByExternalId(externalPostId);

    if (!postObj) {
      throw new ValidationError(
        `Post with external id: ${externalPostId} does not exist.`,
      );
    }

    insertObj.postId = postObj.id;
    const like = await this.repository.insert(insertObj);

    return like;
  }

  async deleteLikeByExternalId(externalLikeId) {
    logger.info('Deleting like by external id: ', externalLikeId);
    await validations.deleteLikeByExternalId(externalLikeId);
    await this.repository.delete({
      search: [
        {
          prop: 'externalLikeId',
          value: externalLikeId,
          operator: '=',
        },
      ],
    });

    return {};
  }

  async deleteLikesByExternalPostId(externalPostId) {
    logger.info('Deleting likes for post: ', externalPostId);
    await validations.deleteLikesByExternalPostId(externalPostId);
    await this.repository.delete({
      search: [
        {
          prop: 'externalPostId',
          value: externalPostId,
          operator: '=',
        },
      ],
    });

    return {};
  }
}

export default LikesService;
