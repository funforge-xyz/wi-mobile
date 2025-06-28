import { logger } from 'firebase-functions';
import firestore from '../../firestore';
import logFirestoreQuery from '../../helpers/firestoreLogger';
import ServiceFactory from '../../web/services/serviceFactory';

const prepareLikesMeta = (
  fromSameUser,
  likesMeta,
) => {
  const dec = firestore.ref.FieldValue.increment(-1);

  return {
    ...likesMeta,
    totalLikes: dec,
    ...(!fromSameUser ? { totalLikesByOthers: dec } : {}),
  };
};

const likesOnDeleteHandler = async (snap, context) => {
  logFirestoreQuery(`posts.${context.params.postId}`);
  const currentData = snap.data();
  const postDoc = await firestore.db
    .collection('posts')
    .doc(context.params.postId)
    .get();
  const postObject = postDoc.data();
  const postAuthorId = postObject && postObject.authorId ? postObject.authorId : null;

  // Posts do not have valid author.
  if (!postAuthorId) {
    logger.info(`Post author id does not exist ${postAuthorId}`);
    return;
  }

  const likesSummaryInfo = prepareLikesMeta(
    currentData.userId === postDoc.data().authorId,
    postDoc.data().likesMeta,
  );

  logger.info(
    `Summary for post after deletion ${context.params.postId}: ${JSON.stringify(
      likesSummaryInfo,
    )}`,
  );

  await postDoc.ref.update({
    'likesMeta.totalLikes': likesSummaryInfo.totalLikes,
    'likesMeta.totalLikesByOthers': likesSummaryInfo.totalLikesByOthers,
  });

  const factory = new ServiceFactory('rdb', context);
  await factory.getLikesService()
    .deleteLikeByExternalId(context.params.likeId);
};

export default likesOnDeleteHandler;
