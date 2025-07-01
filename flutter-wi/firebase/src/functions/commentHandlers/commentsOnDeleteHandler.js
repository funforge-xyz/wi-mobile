import { logger } from 'firebase-functions';
import logFirestoreQuery from '../../helpers/firestoreLogger';
import firestore from '../../firestore';
import ServiceFactory from '../../web/services/serviceFactory';

const prepareCommentsMeta = (
  fromSameUser,
  commentsMeta,
  decrementValue = 1,
) => {
  const dec = firestore.ref.FieldValue.increment(-decrementValue);

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

  // Count how many replies this comment has (if it's a parent comment)
  let totalCommentsToDelete = 1; // The comment itself
  
  try {
    const repliesSnapshot = await firestore.db
      .collection('posts')
      .doc(context.params.postId)
      .collection('comments')
      .doc(context.params.commentId)
      .collection('replies')
      .get();
    
    totalCommentsToDelete += repliesSnapshot.size; // Add the number of replies
    
    logger.info(`Deleting comment ${context.params.commentId} with ${repliesSnapshot.size} replies. Total to delete: ${totalCommentsToDelete}`);
  } catch (error) {
    logger.error(`Error counting replies for comment ${context.params.commentId}:`, error);
    // Continue with just the parent comment count
  }

  // Calculate decrements based on actual number of comments being deleted
  const commentsSummaryInfo = prepareCommentsMeta(
    currentData.authorId === postDoc.data().authorId,
    postDoc.data().commentsMeta,
    totalCommentsToDelete,
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
