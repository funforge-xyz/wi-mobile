import { logger } from 'firebase-functions';
import firestore from '../firestore';

const registerFailedSync = async (actionType, docType, docId, data) => {
  const body = {
    data,
    actionType,
    documentId: docId,
    docType,
    createdAt: firestore.ref.Timestamp.now(),
  };

  logger.info(
    `Registering failed sync for document: ${docId} of type ${docType}`,
  );

  try {
    await firestore.db.collection('failedDbSyncs').doc().set(body);
  } catch (error) {
    logger.error(`An error occured while creating failed sync: ${error}`);
  }
};

// eslint-disable-next-line import/prefer-default-export
export { registerFailedSync };
