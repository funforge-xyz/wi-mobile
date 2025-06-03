import Joi from 'joi';

const schema = {
  createComment: Joi.object({
    externalPostId: Joi.string().required(),
    externalAuthorId: Joi.string().required(),
    externalCommentId: Joi.string().required(),
  }),
};

export default schema;
