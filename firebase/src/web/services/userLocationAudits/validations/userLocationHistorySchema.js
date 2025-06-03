import Joi from 'joi';

const schema = {
  createUserLocationHistory: Joi.object({
    externalUserId: Joi.string().required(),
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
  }),
  getUserLocationAudits: Joi.object({
    search: Joi.array().items(
      Joi.object({
        prop: Joi.string().required(),
        value: Joi.any().required(),
        operator: Joi.string().valid('=', '!=').required(),
      }),
    ),
    params: {
      limit: Joi.number().integer(),
      offset: Joi.number().integer(),
      sortOrder: Joi.string(),
      columns: Joi.string(),
    },
  }),
};

export default schema;
