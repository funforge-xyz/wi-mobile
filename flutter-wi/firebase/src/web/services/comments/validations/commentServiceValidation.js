import joi from 'joi';
import schema from './commentServiceSchema';
import validationHelper from '../../../utils/validationHelper';

const validations = {
  createComment: async (insertRequest) => {
    await validationHelper.validate(insertRequest, schema.createComment);
  },
  deleteCommentByExternalId: async (externalCommentId) => {
    await validationHelper.validateSingleValue(externalCommentId, joi.string().required(), 'externalCommentId');
  },
  deleteCommentsByExternalPostId: async (externalPostId) => {
    await validationHelper.validateSingleValue(externalPostId, joi.string().required(), 'externalPostId');
  },
};

export default validations;
