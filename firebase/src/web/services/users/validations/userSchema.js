import Joi from 'joi';

const schema = {
  getUsers: Joi.object({
    search: Joi.array().items(
      Joi.object({
        prop: Joi.string().required(),
        value: Joi.any().required(),
        operator: Joi.string().valid('=', '!=', '>=', '<=', 'in').required(),
      }),
    ),
    params: {
      limit: Joi.number().integer(),
      offset: Joi.number().integer(),
      sortOrder: Joi.string(),
      columns: Joi.string(),
    },
  }),
  createUser: Joi.object({
    email: Joi.string().required(),
    name: Joi.string().allow(null).allow(''),
    phone: Joi.string().allow(null).allow(''),
    currentNetworkId: Joi.string().allow(null).allow(''),
    imageUrl: Joi.string().allow(null).allow(''),
    about: Joi.string().allow(null).allow(''),
    notifToken: Joi.string().allow(null).allow(''),
    externalUserId: Joi.string().required(),
    lastUpdatedLatitude: Joi.number().allow(null),
    lastUpdatedLongitude: Joi.number().allow(null),
    lastTimeSeen: Joi.date().allow(null),
    timezone: Joi.string().allow(null),
  }),
  updateUserByExternalId: Joi.object({
    email: Joi.string(),
    name: Joi.string().allow(null).allow(''),
    phone: Joi.string().allow(null).allow(''),
    currentNetworkId: Joi.string().allow(null).allow(''),
    imageUrl: Joi.string().allow(null).allow(''),
    about: Joi.string().allow(null).allow(''),
    notifyMe: Joi.boolean(),
    lastTimeSeen: Joi.date().allow(null),
    timezone: Joi.string().allow(null),
  }),
  updateUserLocation: Joi.object({
    lastUpdatedLatitude: Joi.number().required(),
    lastUpdatedLongitude: Joi.number().required(),
  }),
  updateUserNotifToken: Joi.object({
    notifToken: Joi.string().allow(null).required(),
  }),
  getUserPostsNearby: Joi.object({
    search: Joi.object({
      radiusNearby: Joi.number(),
      radiusWider: Joi.number(),
      engagedPostsTimeframe: Joi.string().allow(null).regex(/^\d*\s{1}((\bdays\b)|(\bhours\b)|(\bminutes\b))$/i),
      locationPostsTimeframe: Joi.string().allow(null).regex(/^\d*\s{1}((\bdays\b)|(\bhours\b)|(\bminutes\b))$/i),
      nearbyPostsLimit: Joi.number(),
      geoOffset: Joi.number(),
      widerPostsLimit: Joi.number(),
      // widerPostsOffset: Joi.number(),
      mostEngagedPostsLimit: Joi.number(),
      mostEngagedPostsOffset: Joi.number(),
    }),
    params: Joi.object({
      limit: Joi.number().integer(),
      offset: Joi.number().integer(),
    }),
  }),
  getNearbyUsers: Joi.object({
    search: Joi.object({}).default({}),
    params: Joi.object({
      limit: Joi.number().integer(),
      offset: Joi.number().integer(),
    }),
  }),
  getUsersByDistance: Joi.object({
    search: Joi.object({
      radius: Joi.number().required(),
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
    }).required(),
    params: Joi.object({
      limit: Joi.number().integer().required(),
      offset: Joi.number().integer().required(),
    }).required(),
  }),
};

export default schema;
