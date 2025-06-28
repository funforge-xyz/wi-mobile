import { logger } from 'firebase-functions';

// Temporary added to track firestore queries.
const logFirestoreQuery = (collection) => {
  logger.info(`Querying Firestore collection (${collection})`);
};

export default logFirestoreQuery;
