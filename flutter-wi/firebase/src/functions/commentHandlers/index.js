import * as functions from 'firebase-functions';
import summarizeAndNotifyOnCommentCreateHandler from './sendCommentInitialNotification';
import commentsOnDeleteHandler from './commentsOnDeleteHandler';
import commentsReplyOnWriteHandler from './commentsReplyOnWriteHandler';

const commentsOnDeleteFunction = functions
  .region('europe-west1')
  .firestore.document('/posts/{postId}/comments/{commentId}')
  .onDelete(commentsOnDeleteHandler);

const summarizeAndNotifyOnCommentCreateFunction = functions
  .region('europe-west1')
  .firestore.document('/posts/{postId}/comments/{commentId}')
  .onCreate(summarizeAndNotifyOnCommentCreateHandler);

const commentReplyOnWriteFunction = functions
  .region('europe-west1')
  .firestore.document('/posts/{postId}/comments/{commentId}/replies/{replyId}')
  .onWrite(commentsReplyOnWriteHandler);

export default {
  commentsOnDeleteFunction,
  summarizeAndNotifyOnCommentCreateFunction,
  commentReplyOnWriteFunction,
};
