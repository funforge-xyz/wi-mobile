import Joi from 'joi';

const schema = {
  createPostNotificationDetail: Joi.object({
    postId: Joi.number().integer().required(),
    isScheduledForCommentNotification: Joi.boolean(),
    isScheduledForLikeNotification: Joi.boolean(),
    lastCommentNotificationSentOn: Joi.date(),
    lastLikeNotificationSentOn: Joi.date(),
  }),
  updatePostNotificationDetail: Joi.object({
    isScheduledForCommentNotification: Joi.boolean(),
    isScheduledForLikeNotification: Joi.boolean(),
    lastCommentNotificationSentOn: Joi.date(),
    lastLikeNotificationSentOn: Joi.date(),
  }),
  createOrUpdateNotificationDetail: Joi.object({
    externalPostId: Joi.string().required(),
    isScheduledForCommentNotification: Joi.boolean(),
    isScheduledForLikeNotification: Joi.boolean(),
    lastCommentNotificationSentOn: Joi.date(),
    lastLikeNotificationSentOn: Joi.date(),
  }),
};

export default schema;
