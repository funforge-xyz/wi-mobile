import joi from 'joi';
import schema from './notificationServiceSchema';
import validationHelper from '../../../utils/validationHelper';

const validations = {
  createNotificationEntity: async (notification) => {
    await validationHelper.validate(notification, schema.createNotificationEntity);
  },
  updateNotificationEntity: async (externalNotificationId, notification) => {
    await validationHelper.validateSingleValue(
      externalNotificationId, joi.string().required(), 'externalNotificationId',
    );
    await validationHelper.validate(notification, schema.updateNotificationEntity);
  },
  sendNotification: async (payload, syncPayload) => {
    await validationHelper.validate(payload, schema.notificationPayload);
    await validationHelper.validate(syncPayload, schema.syncPayload);
  },
  sendNotificationToUsers: async (payload) => {
    await validationHelper.validate(payload, schema.notificationPayload);
  },
};

export default validations;
