/* eslint-disable no-await-in-loop */
import { logger } from 'firebase-functions';
import logFirestoreQuery from '../../../helpers/firestoreLogger';
import { checkLoggedUser } from '../../utils/auth';
import { transactionAsync } from '../../utils/decorators';
import { getBoundingBox } from '../../utils/geolocationHelper';
import ValidationError from '../../utils/validationError';
import validations from './validations/postsServiceValidation';

const MOST_ENGAGED_POSTS_DURATION = '7 days';

class PostsService {
  constructor(options) {
    this.repository = options.repository;
    this.context = options.context;
    this.factory = options.factory;
    this.firestore = options.firestore;
    this.firestoreRef = options.firestoreRef;
  }

  async getPosts(search) {
    await validations.getPosts(search);
    const results = await this.repository.findMany(search);
    return results;
  }

  async getPostByExternalId(externalPostId, searchObj) {
    await validations.getPostByExternalId(externalPostId, searchObj);
    logger.info(`Fetching post by externalPostId: ${externalPostId}`);

    let params = {};
    if (searchObj && Object.prototype.hasOwnProperty.call(searchObj, 'params')) {
      params = searchObj.params;
    }

    const result = await this.repository.findOne({
      search: [
        {
          prop: 'externalPostId',
          value: externalPostId,
          operator: '=',
        },
      ],
      params,
    });

    return result;
  }

  async createPost(postObj) {
    logger.info(`Creating post with data: ${JSON.stringify(postObj)}`);
    await validations.createPost(postObj);

    const post = await this.repository.insert(postObj);

    return post;
  }

  async updatePost(externalPostId, postObj) {
    await validations.updatePost(externalPostId, postObj);

    const post = await this.repository.update({ externalPostId }, postObj);

    return post;
  }

  async getPostsByGeolocation(externalUserId, searchObj) {
    await validations.getPostsByGeolocation(externalUserId, searchObj);
    const { radius, timeframe } = searchObj.search;
    const { limit, offset } = searchObj.params;
    logger.info(`Get posts by geolocation for user: ${externalUserId}`);

    const user = await this.factory
      .getUserService()
      .getUserByExternalId(externalUserId);

    if (!user) {
      throw new ValidationError('User does not exist.');
    }

    const { lastUpdatedLatitude, lastUpdatedLongitude } = user;
    const { latitudesBox, longitudesBox } = getBoundingBox(
      lastUpdatedLatitude,
      lastUpdatedLongitude,
      radius,
    );

    const results = await this.repository.callSqlProcedure(
      'get_nearby_posts',
      externalUserId,
      latitudesBox[0],
      latitudesBox[1],
      longitudesBox[0],
      longitudesBox[1],
      timeframe || '1 days',
      limit || 100,
      offset || 0,
    );

    return results;
  }

  async getMostEngagedPosts(externalUserId, searchObj) {
    await validations.getMostEngagedPosts(externalUserId, searchObj);
    const { radius, timeframe } = searchObj.search;
    const { limit, offset } = searchObj.params;
    logger.info(`Get most engaged posts for user: ${externalUserId}`);

    const user = await this.factory
      .getUserService()
      .getUserByExternalId(externalUserId);

    if (!user) {
      throw new ValidationError('User does not exist.');
    }

    const { lastUpdatedLatitude, lastUpdatedLongitude } = user;
    const { latitudesBox, longitudesBox } = getBoundingBox(
      lastUpdatedLatitude,
      lastUpdatedLongitude,
      radius,
    );

    const results = await this.repository.callSqlProcedure(
      'get_most_engaged_posts',
      externalUserId,
      latitudesBox[0],
      latitudesBox[1],
      longitudesBox[0],
      longitudesBox[1],
      MOST_ENGAGED_POSTS_DURATION,
      timeframe || '1 days',
      limit || 100,
      offset || 0,
    );

    return results;
  }

  async createAndSyncPost(postObj) {
    logger.info(`Create and sync post in firebase: ${postObj}`);
    await validations.createAndSyncPost(postObj);
    checkLoggedUser(this.context.user, postObj.authorId);
    const { Timestamp: timestamp } = this.firestoreRef;

    const firestorePostRef = this.firestore.collection('posts').doc();
    const externalPostId = firestorePostRef.id;
    const postFsObj = {
      authorId: postObj.authorId,
      content: postObj.content || null,
      mediaUrl: postObj.mediaUrl || null,
      thumbUrl: postObj.thumbUrl || null,
      allowComments: postObj.allowComments !== undefined ? postObj.allowComments : null,
      allowLikes: postObj.allowComments !== undefined ? postObj.allowLikes : null,
      createdAt: timestamp.now(),
    };

    await firestorePostRef.set(postFsObj);

    try {
      await this.createPost({
        externalPostId,
        externalAuthorId: postObj.authorId,
        imageUrl: postObj.thumbUrl || postObj.mediaUrl,
      });
      return {
        ...postFsObj,
        id: externalPostId,
      };
    } catch (err) {
      logger.error(`An error ocurred when inserting post with id: ${externalPostId} in db: ${err}`);
      await firestorePostRef.delete();
      throw (err);
    }
  }

  @transactionAsync()
  async deletePostsByExternalId(externalPostId) {
    logger.info(`Deleting post from db: ${externalPostId}`);
    await validations.deletePostsByExternalId(externalPostId);

    const post = await this.getPostByExternalId(externalPostId);

    if (post === null) {
      return {};
    }

    await this.factory.getCommentsService()
      .deleteCommentsByExternalPostId(externalPostId);

    await this.factory.getLikesService()
      .deleteLikesByExternalPostId(externalPostId);

    await this.factory.getPostNotificationDetailService()
      .deletePostNotificationDetailByPostId(post.id);

    await this.repository.delete({
      search: [
        {
          prop: 'externalPostId',
          value: externalPostId,
          operator: '=',
        },
      ],
    });

    // Clean all notifcations
    logger.info(`Deleting notifications from FS for post: ${externalPostId}`);
    logFirestoreQuery('notifications');
    const notifications = await this.firestore.collection('notifications')
      .where('data.postId', '==', externalPostId)
      .get();

    let batch = this.firestore.batch();

    for (let i = 0; i < notifications.size; i += 1) {
      const doc = notifications.docs[i];
      try {
        batch.delete(doc.ref);
        if ((i + 1) % 500 === 0) {
          await batch.commit();
          batch = this.firestore.batch();
        }
      } catch (ex) {
        logger.error(`An error occured when tryring to delete notifications for post ${externalPostId}`, ex);
      }
    }

    if (notifications.size !== 0 && notifications.size % 500 !== 0) {
      await batch.commit();
    }

    return {};
  }
}

export default PostsService;
