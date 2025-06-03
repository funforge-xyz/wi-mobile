import joi from 'joi';
import schema from './likeServiceSchema';
import validationHelper from '../../../utils/validationHelper';

const validations = {
  createLike: async (insertRequest) => {
    await validationHelper.validate(insertRequest, schema.createLike);
  },
  deleteLikeByExternalId: async (externalLikeId) => {
    await validationHelper.validateSingleValue(externalLikeId, joi.string().required(), 'externalLikeId');
  },
  deleteLikesByExternalPostId: async (externalPostId) => {
    await validationHelper.validateSingleValue(externalPostId, joi.string().required(), 'externalPostId');
  },
};

export default validations;
