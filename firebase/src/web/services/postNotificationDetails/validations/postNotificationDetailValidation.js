import joi from 'joi';
import schema from './postNotificationDetailSchema';
import validationHelper from '../../../utils/validationHelper';

const validations = {
  getPostNotificationDetailByPostId: async (postId) => {
    await validationHelper.validateSingleValue(postId, joi.number().integer().required(), 'postId');
  },
  createPostNotificationDetail: async (insertObj) => {
    await validationHelper.validate(insertObj, schema.createPostNotificationDetail);
  },
  updatePostNotificationDetail: async (postId, updateObj) => {
    await validationHelper.validateSingleValue(postId, joi.number().integer().required(), 'postId');
    await validationHelper.validate(updateObj, schema.updatePostNotificationDetail);
  },
  deletePostNotificationDetailByPostId: async (postId) => {
    await validationHelper.validateSingleValue(postId, joi.number().required(), 'postId');
  },
  createOrUpdateNotificationDetail: async (request) => {
    await validationHelper.validate(request, schema.createOrUpdateNotificationDetail);
  },
};

export default validations;
