import joi from 'joi';
import schema from './userSchema';
import validationHelper from '../../../utils/validationHelper';

const validations = {
  getUserByExternalId: async (externalUserId) => {
    await validationHelper.validateSingleValue(externalUserId, joi.string().required(), 'externalUserId');
  },
  getNearbyUsers: async (externalUserId, search) => {
    await validationHelper.validateSingleValue(externalUserId, joi.string().required(), 'externalUserId');
    await validationHelper.validate(search, schema.getNearbyUsers);
  },
  createUser: async (insertRequest) => {
    await validationHelper.validate(insertRequest, schema.createUser);
  },
  updateUserByExternalId: async (externalUserId, updateRequest) => {
    await validationHelper.validateSingleValue(externalUserId, joi.string().required(), 'externalUserId');
    await validationHelper.validate(updateRequest, schema.updateUserByExternalId);
  },
  updateUserLocation: async (externalUserId, updateRequest) => {
    await validationHelper.validateSingleValue(externalUserId, joi.string().required(), 'externalUserId');
    await validationHelper.validate(updateRequest, schema.updateUserLocation);
  },
  updateUserNotifToken: async (externalUserId, updateRequest) => {
    await validationHelper.validateSingleValue(externalUserId, joi.string().required(), 'externalUserId');
    await validationHelper.validate(updateRequest, schema.updateUserNotifToken);
  },
  getUserPostsNearby: async (externalUserId, search) => {
    await validationHelper.validateSingleValue(externalUserId, joi.string().required(), 'externalUserId');
    await validationHelper.validate(search, schema.getUserPostsNearby);
  },
  getUsersByDistance: async (externalUserId, searchObj) => {
    await validationHelper.validateSingleValue(externalUserId, joi.string().required(), 'externalUserId');
    await validationHelper.validate(searchObj, schema.getUsersByDistance);
  },
};

export default validations;
