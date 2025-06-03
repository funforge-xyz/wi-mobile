import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import ValidationError from './utils/validationError';
import { AuthError } from './utils/auth';

const getAuthUser = async (request) => {
  logger.info(`Provided auth header: ${request?.headers?.authorization} for request: ${request.method} ${request.path}`);
  if (!request?.headers?.authorization?.startsWith('Bearer ')) {
    logger.info(`Auth header is not provided. Method: ${request.method}. URL: ${request.path}`);
    return null;
  }
  const authToken = request?.headers?.authorization?.split('Bearer ')[1];

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(authToken);
    return decodedIdToken?.user_id || null;
  } catch (err) {
    logger.error('An error occurred while verifying token. ', err);
    return null;
  }
};

const checkAuthorization = async (request) => {
  const user = await getAuthUser(request);

  if (process.env.NODE_ENV === 'dev' || !process.env.NODE_ENV) {
    return {
      statusCode: 200,
      user: null,
    };
  }

  return {
    statusCode: user ? 200 : 403,
    user,
  };
};

const findUrlResource = (resource, method, routes) => {
  const urlItems = resource.substr(1).split('/');
  const urls = routes.map((route) => route.resource);

  let route = null;
  let params = {};
  for (let i = 0; i < urls.length; i += 1) {
    const items = urls[i].substr(1).split('/');
    let matchOne = true;
    params = {};
    for (let j = 0; j < items.length; j += 1) {
      if (items[j].startsWith('{')) {
        const param = items[j].replace('{', '').replace('}', '');
        params[param] = urlItems[j];
        // eslint-disable-next-line no-continue
        continue;
      }
      if (urlItems[j] !== items[j]) {
        matchOne = false;
        break;
      }
    }
    if (matchOne === true && items.length === urlItems.length && method === routes[i].httpMethod) {
      route = i;
      break;
    }
  }

  return route !== null ? {
    route: routes[route],
    params,
  } : null;
};


class Dispatcher {
  constructor(routes) {
    this.routes = routes;
    this.context = {};
  }

  async dispatch(request) {
    const { method, path } = request;
    logger.info(`Http method ${method}. URL: ${path}`);
    const routeObj = findUrlResource(path, method, this.routes);
    let statusCode = 200;
    let result = {};

    if (!routeObj) {
      return {
        statusCode: 404,
        result: {
          message: 'Provided URL does not exist.',
        },
      };
    }

    if (routeObj.route.isAuthorized) {
      const res = await checkAuthorization(request);
      logger.info(`Logged in user id: ${res.user}.`);
      this.context.user = res.user;

      if (res.statusCode === 403) {
        logger.error(`User is not authorized for this request. URL: ${path}`);
        return {
          statusCode: res.statusCode,
          result: null,
        };
      }
    }

    if (method === 'POST') {
      statusCode = 201;
    }

    if (method === 'DELETE') {
      statusCode = 204;
    }
    const requestObj = { params: routeObj.params, body: request.body, query: request.query };

    try {
      result = await routeObj.route.func(requestObj, this.context);
    } catch (exc) {
      logger.error(exc);
      statusCode = 400;
      result = {
        message: 'An error occured while calling API.',
      };

      if (exc instanceof ValidationError) {
        result.message = exc.toString();
      }
      if (exc instanceof AuthError) {
        result.message = exc.toString();
        statusCode = 403;
      }
    }

    return {
      statusCode,
      result,
    };
  }
}

export default Dispatcher;
