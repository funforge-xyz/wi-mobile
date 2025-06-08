import Joi from 'joi';

const schema = {
  getPosts: Joi.object({
    search: Joi.array().items(
      Joi.object({
        prop: Joi.string().valid('createdAt', 'externalAuthorId').required(),
        value: Joi.any().required(),
        operator: Joi.string().valid('=', '!=', '>=', '<=').required(),
      }),
    ),
    params: {
      limit: Joi.number().integer(),
      offset: Joi.number().integer(),
      sortOrder: Joi.string(),
      columns: Joi.string(),
    },
  }),
  createPost: Joi.object({
    externalPostId: Joi.string().required(),
    externalAuthorId: Joi.string().required(),
    imageUrl: Joi.string(),
  }),
  updatePost: Joi.object({
    externalAuthorId: Joi.string(),
    imageUrl: Joi.string(),
  }),
  createAndSyncPost: Joi.object({
    authorId: Joi.string().required(),
    content: Joi.string().allow(null).allow(''),
    mediaURL: Joi.string().allow(null).allow(''),
    thumbURL: Joi.string().allow(null).allow(''),
    allowComments: Joi.boolean().allow(null),
    allowLikes: Joi.boolean().allow(null),
  }),
  getMostEngagedPosts: Joi.object({
    search: Joi.object({
      radius: Joi.number(),
      timeframe: Joi.string().allow(null).regex(/^\d*\s{1}((\bdays\b)|(\bhours\b)|(\bminutes\b))$/i),
    }),
    params: Joi.object({
      limit: Joi.number().integer(),
      offset: Joi.number().integer(),
    }),
  }),
  getPostsByGeolocation: Joi.object({
    search: Joi.object({
      radius: Joi.number(),
      timeframe: Joi.string().allow(null).regex(/^\d*\s{1}((\bdays\b)|(\bhours\b)|(\bminutes\b))$/i),
    }),
    params: Joi.object({
      limit: Joi.number().integer(),
      offset: Joi.number().integer(),
    }),
  }),
};

export default schema;
