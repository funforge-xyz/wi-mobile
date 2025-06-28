import { logger } from 'firebase-functions';
import logFirestoreQuery from '../../helpers/firestoreLogger';
import firestore from '../../firestore';
import ServiceFactory from '../../web/services/serviceFactory';

const prepareCommentsMeta = (
  fromSameUser,
  commentsMeta,
) => {
  const dec = firestore.ref.FieldValue.increment(-1);

  return {
    ...commentsMeta,
    totalComments: dec,
    ...(!fromSameUser ? { totalCommentsByOthers: dec } : {}),
  };
};

const commentsOnDeleteHandler = async (snap, context) => {
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

  const commentsSummaryInfo = prepareCommentsMeta(
    currentData.authorId === postDoc.data().authorId,
    postDoc.data().commentsMeta,
  );

  logger.info(
    `Summary for post after deletion ${context.params.postId}: ${JSON.stringify(
      commentsSummaryInfo,
    )}`,
  );

  await postDoc.ref.update({
    'commentsMeta.totalComments': commentsSummaryInfo.totalComments,
    'commentsMeta.totalCommentsByOthers': commentsSummaryInfo.totalCommentsByOthers,
  });

  const factory = new ServiceFactory('rdb', context);
  await factory.getCommentsService()
    .deleteCommentByExternalId(context.params.commentId);
};

export default commentsOnDeleteHandler;
