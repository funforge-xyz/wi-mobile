import { logger } from 'firebase-functions';

class AuthError extends Error {
  constructor(errors) {
    super('auth error');
    Error.captureStackTrace(this, this.constructor);
    this.name = 'AuthError';
    this.errors = errors;
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }

  toJSON() {
    return {
      hasErrors: true,
      resultList: this.errors,
    };
  }
}

const checkLoggedUser = (reqUserId, loggedInUserId) => {
  // Disable checkings for local testing
  logger.info(`Checking logged in user. Logged in userId (${reqUserId}). Request userId (${loggedInUserId}).`);

  if (process.env.NODE_ENV === 'dev' || !process.env.NODE_ENV) return true;
  if (reqUserId !== loggedInUserId) {
    throw new AuthError('Not authorized to perform this action.');
  }

  return true;
};

export {
  checkLoggedUser,
  AuthError,
};
