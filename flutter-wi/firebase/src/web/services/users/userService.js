import { logger } from 'firebase-functions';
import logFirestoreQuery from '../../../helpers/firestoreLogger';
import validations from './validations/userValidation';
import ValidationError from '../../utils/validationError';
import { checkLoggedUser } from '../../utils/auth';
import { transactionAsync } from '../../utils/decorators';
import { getBoundingBox } from '../../utils/geolocationHelper';
import { postsPageSizeConfig as pageConfig, SILENT_LOCATION_UPDATE_TOPIC } from '../../../constants';

const NEARBY_RADIUS = 1;
const MEDIUM_RADIUS = 5;
const WIDER_RADIUS = 20;
const FEEDS_WIDER_RADIUS = 20;
const NEARBY_USERS_LIMIT = 50;
const MOST_ENGAGED_TIMEFRAME = '20 days';
const NEARBY_POSTS_TIMEFRAME = '20 days';

class UserService {
  constructor(options) {
    this.repository = options.repository;
    this.context = options.context;
    this.factory = options.factory;
    this.firestore = options.firestore;
    this.firestoreRef = options.firestoreRef;
  }

  async getUsers(searchParams) {
    logger.info(`Get all users by params: ${searchParams}`);
    await validations.getUsers(searchParams);

    const users = this.repository.findMany(searchParams);

    return users;
  }

  async getUserByExternalId(externalUserId) {
    await validations.getUserByExternalId(externalUserId);

    // if (options?.checkUser) {
    //  checkLoggedUser(this.context.user, externalUserId);
    // }

    const searchObj = {
      search: [
        { prop: 'externalUserId', value: externalUserId, operator: '=' },
      ],
    };
    const result = await this.repository.findOne(searchObj);

    return result;
  }

  @transactionAsync()
  async createUser(userObj) {
    logger.info(`Creating user object: ${JSON.stringify(userObj)}`);
    await validations.createUser(userObj);
    const { externalUserId } = userObj;

    const existingUser = await this.getUserByExternalId(externalUserId);

    if (existingUser) {
      return null;
    }

    try {
      const user = await this.repository.insert(userObj);
      return user;
    } catch (err) {
      logger.error(`An error occured while saving user: ${err}`);
      throw (err);
    }
  }

  @transactionAsync()
  async updateUserLocation(externalUserId, userObj) {
    logger.info(`Updating location information for user: ${externalUserId} with object: ${JSON.stringify(userObj)}`);
    await validations.updateUserLocation(externalUserId, userObj);
    checkLoggedUser(this.context.user, externalUserId);

    let existingUser = await this.getUserByExternalId(externalUserId);
    if (!existingUser) {
      // NOTE: Trigger event may not occur in the appropriate order.
      // Check if the user exists in firestore
      logFirestoreQuery(`users.${externalUserId}`);
      const userResult = await this.firestore.collection('users').doc(externalUserId).get();
      if (userResult.empty || !userResult.data()) {
        throw new ValidationError('User does not exist');
      }

      existingUser = userResult.data();
      try {
        await this.createUser({
          email: existingUser.email,
          name: existingUser.name,
          phone: existingUser.phone,
          currentNetworkId: existingUser.currentNetworkId,
          imageUrl: existingUser.imageUrl,
          about: existingUser.about,
          externalUserId,
        });
      } catch (err) {
        logger.error(`An error ocurred while trying to insert user: ${err}`);
        throw (err);
      }
    }

    try {
      const currentDate = Date.now();
      const result = await this.repository.update(
        { externalUserId },
        {
          ...userObj,
          lastUpdatedLocation: currentDate,
        },
      );

      const locationHistory = {
        externalUserId,
        latitude: userObj.lastUpdatedLatitude,
        longitude: userObj.lastUpdatedLongitude,
      };

      await this.factory
        .userLocationHistoryService
        .createUserLocationHistory(locationHistory);

      return result;
    } catch (err) {
      logger.error(`An error occured while updating users location: ${err}`);
      throw (err);
    }
  }

  @transactionAsync()
  async updateUserNotifToken(externalUserId, notifObj) {
    logger.info(`Updating notif token for user: ${externalUserId}`);
    await validations.updateUserNotifToken(externalUserId, notifObj);

    let existingUser = await this.getUserByExternalId(externalUserId);

    if (!existingUser) {
      logFirestoreQuery(`users.${externalUserId}`);
      const userResult = await this.firestore.collection('users').doc(externalUserId).get();
      if (userResult.empty) {
        throw new ValidationError('User does not exist');
      }

      existingUser = userResult.data();
      try {
        await this.createUser({
          email: existingUser.email,
          name: existingUser.name,
          phone: existingUser.phone,
          currentNetworkId: existingUser.currentNetworkId,
          imageUrl: existingUser.imageUrl,
          about: existingUser.about,
          externalUserId,
        });
      } catch (err) {
        logger.error(`An error ocurred while trying to insert user: ${err}`);
      }
    }

    if (existingUser.notifToken) {
      await this.factory.getNotificationService().unsubscribeUserTokenFromTopic(
        notifObj.notifToken, SILENT_LOCATION_UPDATE_TOPIC,
      );
    }

    const result = await this.repository.update({ externalUserId }, notifObj);

    return result;
  }


  @transactionAsync()
  async updateUserByExternalId(externalUserId, updateObj) {
    await validations.updateUserByExternalId(externalUserId, updateObj);

    const result = await this.repository.update({ externalUserId }, updateObj);

    return result;
  }

  async getUserPostsNearby(externalUserId, searchObj) {
    logger.info(`Stated fetching nearby posts for user: ${externalUserId}`);
    await validations.getUserPostsNearby(externalUserId, searchObj);
    const {
      radiusNearby = NEARBY_RADIUS,
      radiusWider = FEEDS_WIDER_RADIUS,
      engagedPostsTimeframe = MOST_ENGAGED_TIMEFRAME,
      locationPostsTimeframe = NEARBY_POSTS_TIMEFRAME,
      nearbyPostsLimit = pageConfig.NEARBY_AREA_FEEDS,
      widerPostsLimit = pageConfig.WIDER_AREA_FEEDS,
      geoOffset = 0,
      mostEngagedPostsLimit = pageConfig.MOST_ENGAGED_FEEDS,
      mostEngagedPostsOffset = 0,
    } = searchObj.search;

    if (radiusNearby >= radiusWider) {
      throw new ValidationError('Wrong radius ratio. Nearby radius should be smaller than radius for wider area.');
    }

    // Get user's posts in last 10 minutes. These results are excluded from total limit.
    const usersNewestPostTimeframe = new Date();
    usersNewestPostTimeframe.setMinutes(usersNewestPostTimeframe.getMinutes() - 10);

    let currentUserPosts = [];
    const results = await this.factory
      .getPostsService()
      .getPosts({
        search: [
          { prop: 'externalAuthorId', value: externalUserId, operator: '=' },
          { prop: 'createdAt', value: usersNewestPostTimeframe, operator: '>=' },
        ],
        params: {
          offset: 0, limit: 20, sortOrder: 'createdAt desc', columns: 'externalPostId,createdAt',
        },
      });

    if (results?.resultList) {
      currentUserPosts = results.resultList;
    }
    logger.info(`Current User Posts: ${currentUserPosts}`);
    // Get user's posts nearby
    const nearbyPosts = await this.factory
      .getPostsService()
      .getPostsByGeolocation(
        externalUserId,
        {
          search: {
            radius: radiusNearby,
            timeframe: locationPostsTimeframe,
          },
          params: { limit: nearbyPostsLimit, offset: geoOffset },
        },
      );

    // Get user's posts in wider radius
    const widerPosts = await this.factory
      .getPostsService()
      .getPostsByGeolocation(
        externalUserId,
        {
          search: {
            radius: radiusWider,
            timeframe: locationPostsTimeframe,
          },
          params: { limit: widerPostsLimit, offset: geoOffset + nearbyPosts.length },
        },
      );

    // Get most engaged user posts
    const mostEngagedPosts = await this.factory
      .getPostsService().getMostEngagedPosts(
        externalUserId,
        {
          search: {
            radius: radiusWider,
            timeframe: engagedPostsTimeframe,
          },
          params: { limit: mostEngagedPostsLimit, offset: mostEngagedPostsOffset },
        },
      );

    const responseArrays = {
      postsInNearbyArea: nearbyPosts,
      postsInWiderArea: widerPosts.filter(
        (post) => !nearbyPosts.find(
          (nearbyPost) => nearbyPost.externalPostId === post.externalPostId,
        )
          && !mostEngagedPosts.find(
            (mostEngagedPost) => mostEngagedPost.externalPostId === post.externalPostId,
          ),
      ),
      mostEngagedPosts: mostEngagedPosts.filter(
        (post) => !nearbyPosts.find(
          (nearbyPost) => nearbyPost.externalPostId === post.externalPostId,
        ),
      ),
    };

    const stepSize = 3;
    const arrayLength = Math.max(...Object.keys(responseArrays)
      .map((key) => (responseArrays[key] ? responseArrays[key].length : 0)));

    const resultList = [];
    for (let i = 0; i < arrayLength; i += stepSize) {
      resultList.push(...responseArrays.postsInNearbyArea.slice(i, i + stepSize));
      resultList.push(...responseArrays.postsInWiderArea.slice(i, i + stepSize));
      resultList.push(...responseArrays.mostEngagedPosts.slice(i, i + stepSize));
    }

    return {
      resultList: [...currentUserPosts, ...resultList],
      meta: {
        nearbyPosts: responseArrays.postsInNearbyArea.length,
        widerPosts: responseArrays.postsInWiderArea.length,
        mostEngagedPosts: responseArrays.mostEngagedPosts.length,
      },
    };
  }

  async getUsersByDistance(externalUserId, searchObj) {
    await validations.getUsersByDistance(externalUserId, searchObj);
    const { latitude, longitude, radius } = searchObj.search;
    const { limit, offset } = searchObj.params;

    const { latitudesBox, longitudesBox } = getBoundingBox(
      latitude,
      longitude,
      radius,
    );

    const results = await this.repository.callSqlProcedure(
      'get_nearby_users',
      externalUserId,
      latitude,
      longitude,
      1, // Not used parameter, consider removal
      latitudesBox[0],
      latitudesBox[1],
      longitudesBox[0],
      longitudesBox[1],
      limit,
      offset,
    );

    return results;
  }

  async getNearbyUsers(externalUserId, searchObj) {
    logger.info(`Get nearby users for user: ${externalUserId}`);
    await validations.getNearbyUsers(externalUserId, searchObj);
    const { params } = searchObj;
    const nearbyUsersLimit = params.limit || NEARBY_USERS_LIMIT;

    const user = await this.getUserByExternalId(externalUserId);
    if (!user) {
      throw new ValidationError('User not found');
    }

    const { lastUpdatedLatitude, lastUpdatedLongitude } = user;
    const userSearchObj = {
      latitude: lastUpdatedLatitude,
      longitude: lastUpdatedLongitude,
    };

    const results = await this.getUsersByDistance(
      externalUserId,
      {
        search: {
          ...userSearchObj,
          radius: NEARBY_RADIUS,
        },
        params: {
          limit: nearbyUsersLimit,
          offset: params.offset || 0,
        },
      },
    );

    if (nearbyUsersLimit === results.length) {
      return {
        resultList: results,
      };
    }

    const mediumDistanceUsers = await this.getUsersByDistance(
      externalUserId,
      {
        search: {
          ...userSearchObj,
          radius: MEDIUM_RADIUS,
        },
        params: {
          limit: nearbyUsersLimit,
          offset: (params.offset || 0) + results.length,
        },
      },
    );

    results.push(...mediumDistanceUsers);

    if (nearbyUsersLimit === results.length) {
      return {
        resultList: results,
      };
    }

    const largeDistanceUsers = await this.getUsersByDistance(
      externalUserId,
      {
        search: {
          ...userSearchObj,
          radius: WIDER_RADIUS,
        },
        params: {
          limit: nearbyUsersLimit,
          offset: (params.offset || 0) + results.length,
        },
      },
    );

    results.push(...largeDistanceUsers);

    return {
      resultList: results,
    };
  }

  async getInactiveUsersForNotification() {
    logger.info('Retrieving users for inactivity notification');
    const inactiveUsers = await this.repository.callSqlProcedure(
      'get_inactive_users',
    );
    return inactiveUsers;
  }
}

export default UserService;
