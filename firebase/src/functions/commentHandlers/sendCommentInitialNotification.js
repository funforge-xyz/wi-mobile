import { logger } from 'firebase-functions';
import firestore from '../../firestore';
import logFirestoreQuery from '../../helpers/firestoreLogger';
import ServiceFactory from '../../web/services/serviceFactory';
import {
  notificationActionType,
  notificationType,
  notificationTitle,
  documentType,
  syncAction,
} from '../../constants';
import {
  prepareNotificationBody,
} from '../../helpers/notificationSync';
import { registerFailedSync } from '../../helpers/failedSyncRegistration';


const prepareCommentsSummary = (
  commentAuthorId,
  post,
  timestamp,
) => {
  let totalCommentsByOthers = post?.commentsMeta?.totalCommentsByOthers || 0;
  let lastNotificationSentOn = post?.commentsMeta?.lastNotificationSentOn || null;
  let lastCommentsTotalWhenNotified = post?.commentsMeta?.lastCommentsTotalWhenNotified || 0;

  if (commentAuthorId !== post.authorId) {
    if (totalCommentsByOthers === 0 && !lastNotificationSentOn) {
      lastNotificationSentOn = timestamp;
      lastCommentsTotalWhenNotified = 1;
    }
    totalCommentsByOthers += 1;
  }

  return {
    totalComments: firestore.ref.FieldValue.increment(1),
    totalCommentsByOthers,
    lastCommentsTotalWhenNotified,
    lastNotificationSentOn,
    scheduled:
      totalCommentsByOthers !== lastCommentsTotalWhenNotified
      && totalCommentsByOthers !== 1,
  };
};

const summarizeAndNotifyOnCommentCreateHandler = async (snap, context) => {
  const { Timestamp: timestamp } = firestore.ref;
  const currentData = snap.data();
  const dateTime = timestamp.now();

  logFirestoreQuery(`posts.${context.params.postId}`);
  const postRef = firestore.db
    .collection('posts')
    .doc(context.params.postId);

  const result = await firestore.db.runTransaction(async (transaction) => {
    const doc = await transaction.get(postRef);
    const commentsSummary = prepareCommentsSummary(
      currentData.authorId,
      doc.data(),
      dateTime,
    );

    await transaction.update(postRef, {
      'commentsMeta.totalComments': commentsSummary.totalComments,
      'commentsMeta.totalCommentsByOthers': commentsSummary.totalCommentsByOthers,
      'commentsMeta.lastCommentsTotalWhenNotified': commentsSummary.lastCommentsTotalWhenNotified,
      'commentsMeta.lastNotificationSentOn': commentsSummary.lastNotificationSentOn,
      'commentsMeta.scheduled': commentsSummary.scheduled,
    });

    return {
      postAuthorId: doc.data().authorId,
      commentsSummaryInfo: commentsSummary,
    };
  });

  const { postAuthorId, commentsSummaryInfo } = result;

  const commentInsertBody = {
    externalCommentId: context.params.commentId,
    externalPostId: context.params.postId,
    externalAuthorId: currentData.authorId,
  };

  const factory = new ServiceFactory('rdb', context);

  try {
    await factory.getCommentsService().createComment(commentInsertBody);
  } catch (ex) {
    logger.error('An error occured while syncing comments in db: ', ex);
    await registerFailedSync(
      syncAction.CREATE,
      documentType.COMMENT,
      context.params.commentId,
      commentInsertBody,
    );
  }

  const scheduleNotificationBody = {
    isScheduledForCommentNotification: currentData.authorId !== postAuthorId,
  };

  // Send notification on initial comment from other user
  if (
    commentsSummaryInfo.totalCommentsByOthers === 1
      && postAuthorId !== currentData.authorId
      && commentsSummaryInfo.lastNotificationSentOn === dateTime
  ) {
    logFirestoreQuery(`/users/${currentData.authorId}`);
    const commenter = await firestore.db
      .doc(`/users/${currentData.authorId}`)
      .get();

    const payload = {
      notification: {
        title: commenter.data().name || commenter.data().email,
        body: currentData.content,
        click_action: notificationActionType.FLUTTER_CLICK,
      },
      data: {
        type: notificationType.NEW_COMMENT,
        postId: context.params.postId,
        commentId: context.params.commentId,
        userId: currentData.authorId,
      },
    };

    const notificationBody = prepareNotificationBody(
      currentData.authorId,
      postAuthorId,
      notificationTitle.NEW_COMMENT,
      `${commenter.data().name} commented on your feed`,
      payload.data,
    );

    const { shouldBeNotified, userEntity } = await factory.getNotificationService()
      .checkForNotificationSending(postAuthorId);

    if (shouldBeNotified && userEntity?.notifToken) {
      logger.info(`Preparing to send initial comment notification to user: ${postAuthorId}`);
      await factory.getNotificationService().sendAndSyncNotification(
        userEntity.notifToken,
        payload,
        notificationBody,
      );
    }
    scheduleNotificationBody.isScheduledForCommentNotification = false;
    scheduleNotificationBody.lastCommentNotificationSentOn = new Date();
  }

  await factory.getPostNotificationDetailService()
    .createOrUpdatePostNotificationDetail({
      externalPostId: context.params.postId,
      ...scheduleNotificationBody,
    });
};

export default summarizeAndNotifyOnCommentCreateHandler;
