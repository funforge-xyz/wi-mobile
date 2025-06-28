import { logger } from 'firebase-functions';
import ValidationError from '../../utils/validationError';
import validations from './validations/commentServiceValidation';

class CommentsService {
  constructor(options) {
    this.repository = options.repository;
    this.context = options.context;
    this.factory = options.factory;
  }

  async createComment(commentObj) {
    await validations.createComment(commentObj);

    const insertObj = { ...commentObj };
    const { externalPostId } = insertObj;

    const postObj = await this.factory.getPostsService().getPostByExternalId(externalPostId);

    if (!postObj) {
      throw new ValidationError(`Post with external id: ${externalPostId} does not exist.`);
    }

    insertObj.postId = postObj.id;
    const comment = await this.repository.insert(insertObj);

    return comment;
  }

  async deleteCommentByExternalId(externalCommentId) {
    logger.info('Deleting comment by external id: ', externalCommentId);
    await validations.deleteCommentByExternalId(externalCommentId);
    await this.repository.delete({
      search: [
        {
          prop: 'externalCommentId',
          value: externalCommentId,
          operator: '=',
        },
      ],
    });

    return {};
  }

  async deleteCommentsByExternalPostId(externalPostId) {
    logger.info('Deleting comments for post: ', externalPostId);
    await validations.deleteCommentsByExternalPostId(externalPostId);
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

export default CommentsService;
