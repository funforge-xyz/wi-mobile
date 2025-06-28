/* eslint-disable no-await-in-loop */
import { logger } from 'firebase-functions';
import validations from './validations/postNotificationDetailValidation';

class PostNotificationDetailService {
  constructor(options) {
    this.repository = options.repository;
    this.context = options.context;
    this.factory = options.factory;
    this.firestore = options.firestore;
    this.firestoreRef = options.firestoreRef;
  }

  async getPostNotificationDetailByPostId(postId) {
    logger.info(`Get post notification detail for: ${postId}`);
    await validations.getPostNotificationDetailByPostId(postId);
    const result = await this.repository.findOne({
      search: [
        {
          prop: 'postId',
          value: postId,
          operator: '=',
        },
      ],
    });

    return result;
  }

  async createPostNotificationDetail(insertRequest) {
    logger.info('Create post notification detail.');
    await validations.createPostNotificationDetail(insertRequest);

    const results = await this.repository.insert(insertRequest);

    return results;
  }

  async updatePostNotificationDetail(postId, updateRequest) {
    logger.info(`Update for postDetail: ${postId} post notification detail: ${JSON.stringify(updateRequest)}`);
    await validations.updatePostNotificationDetail(postId, updateRequest);

    await this.repository.update({ id: postId }, updateRequest);
  }

  async createOrUpdatePostNotificationDetail(requestBody) {
    logger.info(`Create or update post notification detail: ${JSON.stringify(requestBody)}`);
    await validations.createOrUpdateNotificationDetail(requestBody);
    const { externalPostId, ...restData } = requestBody;

    const postObj = await this.factory.getPostsService().getPostByExternalId(externalPostId);

    if (postObj === null || postObj === undefined) {
      throw new Error(`Post with id: ${externalPostId} does not exist`);
    }

    const result = await this.getPostNotificationDetailByPostId(postObj.id);
    if (result !== null && result !== undefined) {
      await this.updatePostNotificationDetail(postObj.id, restData);
    } else {
      await this.createPostNotificationDetail({ postId: postObj.id, ...restData });
    }
  }

  async deletePostNotificationDetailByPostId(postId) {
    await validations.deletePostNotificationDetailByPostId(postId);

    await this.repository.delete({
      search: [
        {
          prop: 'postId',
          value: postId,
          operator: '=',
        },
      ],
    });
  }
}

export default PostNotificationDetailService;
