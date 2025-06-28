import joi from 'joi';
import schema from './postsServiceSchema';
import validationHelper from '../../../utils/validationHelper';

const validations = {
  getPosts: async (search) => {
    await validationHelper.validate(search, schema.getPosts);
  },
  getPostByExternalId: async (externalId) => {
    await validationHelper.validateSingleValue(externalId, joi.string().required(), 'externalId');
  },
  createPost: async (insertRequest) => {
    await validationHelper.validate(insertRequest, schema.createPost);
  },
  updatePost: async (externalPostId, updateRequest) => {
    await validationHelper.validateSingleValue(externalPostId, joi.string().required(), 'externalPostId');
    await validationHelper.validate(updateRequest, schema.updatePost);
  },
  createAndSyncPost: async (insertRequest) => {
    await validationHelper.validate(insertRequest, schema.createAndSyncPost);
  },
  getMostEngagedPosts: async (externalUserId, search) => {
    await validationHelper.validateSingleValue(externalUserId, joi.string().required(), 'externalUserId');
    await validationHelper.validate(search, schema.getMostEngagedPosts);
  },
  getPostsByGeolocation: async (externalUserId, search) => {
    await validationHelper.validateSingleValue(externalUserId, joi.string().required(), 'externalUserId');
    await validationHelper.validate(search, schema.getPostsByGeolocation);
  },
  deletePostsByExternalId: async (externalPostId) => {
    await validationHelper.validateSingleValue(externalPostId, joi.string().required(), 'externalPostId');
  },
};

export default validations;
