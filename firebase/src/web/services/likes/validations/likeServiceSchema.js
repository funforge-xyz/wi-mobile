import Joi from 'joi';

const schema = {
  createLike: Joi.object({
    externalPostId: Joi.string().required(),
    externalAuthorId: Joi.string().required(),
    externalLikeId: Joi.string().required(),
  }),
};

export default schema;
