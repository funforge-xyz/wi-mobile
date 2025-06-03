import Joi from 'joi';

const schema = {
  createNotificationEntity: Joi.object({
    externalNotificationId: Joi.string().allow(null),
    title: Joi.string().allow(null),
    body: Joi.string().allow(null),
    creatorUserExternalId: Joi.string().allow(null),
    targetUserExternalId: Joi.string().required(),
    dateOpened: Joi.date().allow(null),
    dateRead: Joi.date().allow(null),
    notificationData: Joi.object().allow(null),
    notificationTypeId: Joi.number().integer(),
  }),
  updateNotificationEntity: Joi.object({
    title: Joi.string().allow(null),
    body: Joi.string().allow(null),
    dateOpened: Joi.date().allow(null),
    dateRead: Joi.date().allow(null),
    notificationData: Joi.object().allow(null),
  }),
  notificationPayload: Joi.object({
    data: Joi.object(),
    notification: Joi.object(),
  }).required(),
  syncPayload: Joi.object({
    creatorUserId: Joi.string().allow(null).required(),
    targetUserId: Joi.string().allow(null).required(),
    title: Joi.string().allow(null).required(),
    body: Joi.string().allow(null).required(),
    data: Joi.object(),
  }),
};

export default schema;
