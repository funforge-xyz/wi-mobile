/* eslint-disable no-await-in-loop */
import { logger } from 'firebase-functions';
import firestore from '../../firestore';
import ServiceFactory from '../../web/services/serviceFactory';
import { documentType, syncAction } from '../../constants';

const usersOnFailedDbSync = async (factory, type, userId, data) => {
  switch (type) {
    case syncAction.CREATE: {
      await factory.getUserService().createUser(data);
      break;
    }
    case syncAction.UPDATE: {
      await factory.getUserService().updateUserByExternalId(userId, data);
      break;
    }
    default:
      logger.error('Action type not found for users document:', type);
      throw new Error('Sync action type does not exist.');
  }
};

const failedDbSyncScheduler = async (context) => {
  logger.info(`Searching for failed syncs: ${context}`);
  const failedDbSyncs = await firestore.db.collection('failedDbSyncs').get();

  // NOTE: Should iterate over each item in the list and try to insert in to postgres.
  // If the insertion is done, than delete it from collection.
  const factory = new ServiceFactory('rdb', context);

  // Each batch can have up tp 500 documents.
  // If size is greated than 500, muliple batches should be created.
  let batch = firestore.db.batch();

  for (let i = 0; i < failedDbSyncs.size; i += 1) {
    const doc = failedDbSyncs.docs[i];
    const {
      docType, data, documentId, actionType,
    } = doc.data();
    try {
      switch (docType) {
        case documentType.USER: {
          await usersOnFailedDbSync(factory, actionType, documentId, data);
          batch.delete(doc.ref);
          break;
        }
        case documentType.COMMENT: {
          await factory.getCommentsService().createComment(data);
          batch.delete(doc.ref);
          break;
        }
        case documentType.LIKE: {
          await factory.getLikesService().createLike(data);
          batch.delete(doc.ref);
          break;
        }
        case documentType.POST: {
          await factory.getPostsService().createPost(data);
          batch.delete(doc.ref);
          break;
        }
        case documentType.NOTIF_TOKEN: {
          const { userId, ...restData } = data;
          await factory.getUserService().updateUserNotifToken(userId, restData);
          batch.delete(doc.ref);
          break;
        }
        default: logger.error('Invalid type', docType);
      }
    } catch (ex) {
      logger.error(`An error occured when tryring to resync doc: ${doc.id} of type ${docType}`, ex);
    }

    if ((i + 1) % 500 === 0) {
      await batch.commit();
      batch = firestore.db.batch();
    }
  }
  if (failedDbSyncs.size % 500 !== 0) {
    await batch.commit();
  }
};

export default failedDbSyncScheduler;
