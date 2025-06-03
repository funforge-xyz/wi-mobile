import CommentsService from './comments/commentService';
import CommentLikeSummaryDetailService from './commentLikeSummaryDetails/commentLikeSummaryDetailService';
import LikesService from './likes/likeService';
import NotificationService from './notifications/notificationService';
import UserService from './users/userService';
import UserBlockService from './userBlocks/userBlockService';
import UserLocationHistoryService from './userLocationAudits/userLocationHistoryService';
import PostsService from './posts/postService';
import PostNotificationDetailService from './postNotificationDetails/postNotificationDetailService';
import TimezoneService from './timezone/timezoneService';
import SequelizeRepository from '../../db/sequelizeRepository';
import firestore from '../../firestore';
import models from '../../db/models';

const createSrv = (context, model, serviceFn, factory, useFirestore = false) => {
  const options = { factory, context };
  if (model) {
    options.repository = new SequelizeRepository({
      context,
      model,
      sequelize: models.sequelize,
      models,
    });
  }
  if (useFirestore) {
    options.firestore = firestore.db;
    options.firestoreRef = firestore.ref;
  }

  return serviceFn(options);
};

class ServiceFactory {
  constructor(instanceType, requestContext) {
    this.context = requestContext;

    switch (instanceType) {
      case 'rdb': {
        this.postsService = createSrv(
          this.context,
          models.Post,
          (options) => new PostsService(options),
          this,
          true,
        );
        this.commentsService = createSrv(
          this.context,
          models.Comment,
          (options) => new CommentsService(options),
          this,
        );
        this.likesService = createSrv(
          this.context,
          models.Like,
          (options) => new LikesService(options),
          this,
        );
        this.userService = createSrv(
          this.context,
          models.User,
          (options) => new UserService(options),
          this,
          true,
        );
        this.userLocationHistoryService = createSrv(
          this.context,
          models.UserLocationAudit,
          (options) => new UserLocationHistoryService(options),
          this,
        );
        this.notificationService = createSrv(
          this.context,
          models.Notification,
          (options) => new NotificationService(options),
          this,
          true,
        );
        this.timezoneService = createSrv(
          this.context,
          models.User,
          (options) => new TimezoneService(options),
          this,
          true,
        );
        this.commentLikeSummaryDetailService = createSrv(
          this.context,
          models.CommentLikeSummaryDetail,
          (options) => new CommentLikeSummaryDetailService(options),
          this,
          false,
        );
        this.postNotificationDetailService = createSrv(
          this.context,
          models.PostNotificationDetail,
          (options) => new PostNotificationDetailService(options),
          this,
          true,
        );
        this.userBlockService = createSrv(
          this.context,
          models.UserBlock,
          (options) => new UserBlockService(options),
          this,
          true,
        );
        break;
      }
      default:
        throw new Error(`Invalid factory: ${instanceType}`);
    }
  }

  getPostsService() {
    return this.postsService;
  }

  getCommentsService() {
    return this.commentsService;
  }

  getLikesService() {
    return this.likesService;
  }

  getUserService() {
    return this.userService;
  }

  getUserLocationHistoryService() {
    return this.userLocationHistoryService;
  }

  getNotificationService() {
    return this.notificationService;
  }

  getTimezoneService() {
    return this.timezoneService;
  }

  getPostNotificationDetailService() {
    return this.postNotificationDetailService;
  }

  getCommentLikeSummaryDetailService() {
    return this.commentLikeSummaryDetailService;
  }

  getUserBlockService() {
    return this.userBlockService;
  }
}

export default ServiceFactory;
