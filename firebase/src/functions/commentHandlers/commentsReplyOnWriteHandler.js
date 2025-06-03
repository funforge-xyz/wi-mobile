import { logger } from 'firebase-functions';
import firestore from '../../firestore';

const commentsReplyOnWriteHandler = async (change, context) => {
  logger.info('Starting reply comments handler');

  const { postId } = context.params;
  const { after, before } = change;
  let incrementValue = 0;

  if (!before.data()?.content) {
    // Indicates create reply action.
    incrementValue = 1;
  } else if (!after.data()?.content) {
    // Indicates delete reply action.
    incrementValue = -1;
  } else {
    return;
  }

  const postDoc = await firestore.db
    .collection('posts')
    .doc(postId)
    .get();

  logger.info(`Incrementing comments with value: ${incrementValue}`);
  await postDoc.ref.update({
    'commentsMeta.totalComments': firestore.ref.FieldValue.increment(incrementValue),
  });
};

export default commentsReplyOnWriteHandler;
