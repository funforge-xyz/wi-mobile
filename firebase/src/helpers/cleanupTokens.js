import { logger } from 'firebase-functions';

const cleanupTokens = (response, tokens, tokenRefs) => {
  const tokensDelete = [];
  response.results.forEach((result, index) => {
    const { error } = result;
    if (error) {
      logger.error(error);
      logger.error(`Failure sending notification to: ${tokens[index]}`);
      if (error.code === 'messaging/invalid-registration-token'
        || error.code === 'messaging/registration-token-not-registered') {
        tokensDelete.push(tokenRefs[tokens[index]].ref.delete());
      }
    }
  });
  return Promise.all(tokensDelete);
};

export default cleanupTokens;
