import qs from 'qs';
import ServiceFactory from './services/serviceFactory';
import { prepareQueryParams } from './utils/requestHelper';

const routeTable = [
  {
    resource: '/api/users/{externalUserId}/nearby-posts',
    httpMethod: 'GET',
    isAuthorized: true,
    func: async (request, context) => {
      const factory = new ServiceFactory('rdb', context);
      const queryParams = prepareQueryParams(qs.parse(request.query));
      const { params } = request;

      return factory.getUserService().getUserPostsNearby(params.externalUserId, queryParams);
    },
  },
  {
    resource: '/api/users/{externalUserId}/nearby-users',
    httpMethod: 'GET',
    isAuthorized: true,
    func: async (request, context) => {
      const factory = new ServiceFactory('rdb', context);
      const queryParams = prepareQueryParams(qs.parse(request.query));
      const { params } = request;

      return factory.getUserService().getNearbyUsers(params.externalUserId, queryParams);
    },
  },
  {
    resource: '/api/users/{externalUserId}/location',
    httpMethod: 'PATCH',
    isAuthorized: true,
    func: async (request, context) => {
      const factory = new ServiceFactory('rdb', context);
      const { body, params } = request;

      return factory.getUserService().updateUserLocation(
        params.externalUserId,
        body,
      );
    },
  },
  {
    resource: '/api/users/{externalUserId}',
    httpMethod: 'GET',
    isAuthorized: true,
    func: async (request, context) => {
      const factory = new ServiceFactory('rdb', context);
      const { params } = request;

      return factory
        .getUserService()
        .getUserByExternalId(params.externalUserId, { checkUser: true });
    },
  },
  {
    resource: '/api/posts',
    httpMethod: 'POST',
    isAuthorized: true,
    func: async (request, context) => {
      const factory = new ServiceFactory('rdb', context);
      const { body } = request;

      return factory
        .getPostsService()
        .createAndSyncPost(body);
    },
  },
  {
    resource: '/api/users/{externalUserId}/block/{blockedExternalUserId}',
    httpMethod: 'PATCH',
    isAuthorized: true,
    func: async (request, context) => {
      const factory = new ServiceFactory('rdb', context);
      const { params } = request;

      return factory
        .getUserBlockService()
        .blockUser(
          params.externalUserId,
          params.blockedExternalUserId,
        );
    },
  },
  {
    resource: '/api/users/{externalUserId}/unblock/{blockedExternalUserId}',
    httpMethod: 'PATCH',
    isAuthorized: true,
    func: async (request, context) => {
      const factory = new ServiceFactory('rdb', context);
      const { params } = request;

      return factory
        .getUserBlockService()
        .unblockUser(
          params.externalUserId,
          params.blockedExternalUserId,
        );
    },
  },
  {
    resource: '/api/users/{externalUserId}/blocked-users',
    httpMethod: 'GET',
    isAuthorized: true,
    func: async (request, context) => {
      const factory = new ServiceFactory('rdb', context);
      const { params } = request;

      return factory
        .getUserBlockService()
        .getBlockedUsers(params.externalUserId);
    },
  },
  // {
  //   resource: '/api/temp-subscribe',
  //   httpMethod: 'GET',
  //   func: async (request, context) => {
  //     const factory = new ServiceFactory('rdb', context);
  //     const { body } = request;

  //     return factory
  //       .getNotificationService()
  //       .subscribeUserOnTopicTemp();
  //   },
  // },
];

export default routeTable;
