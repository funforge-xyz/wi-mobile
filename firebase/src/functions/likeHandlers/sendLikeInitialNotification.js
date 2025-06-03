import { logger } from 'firebase-functions';
import firestore from '../../firestore';
import logFirestoreQuery from '../../helpers/firestoreLogger';
import {
  notificationActionType,
  notificationType,
  notificationTitle,
  documentType,
  syncAction,
} from '../../constants';
import ServiceFactory from '../../web/services/serviceFactory';
import {
  prepareNotificationBody,
} from '../../helpers/notificationSync';
import { registerFailedSync } from '../../helpers/failedSyncRegistration';


const prepareLikesSummary = (likeAuthorId, post, timestamp) => {
  const totalLikes = post?.likesMeta?.totalLikes || 0;
  let totalLikesByOthers = post?.likesMeta?.totalLikesByOthers || 0;
  let lastNotificationSentOn = post?.likesMeta?.lastNotificationSentOn || null;
  let lastLikesTotalWhenNotified = post.likesMeta?.lastLikesTotalWhenNotified || 0;

  if (likeAuthorId !== post.authorId) {
    if (totalLikesByOthers === 0 && !lastNotificationSentOn) {
      lastNotificationSentOn = timestamp;
      lastLikesTotalWhenNotified = 1;
    }
    totalLikesByOthers += 1;
  }
  return {
    totalLikes: totalLikes + 1,
    totalLikesByOthers,
    lastLikesTotalWhenNotified,
    lastNotificationSentOn,
    scheduled:
      totalLikesByOthers !== lastLikesTotalWhenNotified
      && totalLikesByOthers !== 1,
  };
};

const summarizeAndNotifyOnLikeCreateHandler = async (snap, context) => {
  const { Timestamp: timestamp } = firestore.ref;
  const currentData = snap.data();
  const dateTime = timestamp.now();

  logFirestoreQuery(`posts.${context.params.postId}`);
  const postRef = firestore.db
    .collection('posts')
    .doc(context.params.postId);

  const result = await firestore.db.runTransaction(async (transaction) => {
    const doc = await transaction.get(postRef);
    const likesSummaryInfo = prepareLikesSummary(
      currentData.userId,
      doc.data(),
      dateTime,
    );
    logger.info(
      `Likes summary for post ${context.params.postId}: ${JSON.stringify(
        likesSummaryInfo,
      )}`,
    );
    await transaction.update(postRef, { likesMeta: likesSummaryInfo });

    return {
      postAuthorId: doc.data().authorId,
      likesSummaryInfo,
    };
  });

  const { postAuthorId, likesSummaryInfo } = result;

  const likeInsertBody = {
    externalLikeId: context.params.likeId,
    externalPostId: context.params.postId,
    externalAuthorId: currentData.userId,
  };

  const factory = new ServiceFactory('rdb', context);

  try {
    await factory.getLikesService().createLike(likeInsertBody);
  } catch (ex) {
    logger.error('An error occured while syncing likes in db: ', ex);
    await registerFailedSync(
      syncAction.CREATE,
      documentType.LIKE,
      context.params.likeId,
      likeInsertBody,
    );
  }


  const scheduleNotificationBody = {
    isScheduledForLikeNotification: currentData.userId !== postAuthorId,
  };

  // Send notification on initial like from other user
  if (
    likesSummaryInfo.totalLikesByOthers === 1
      && postAuthorId !== currentData.authorId
      && likesSummaryInfo.lastNotificationSentOn === dateTime
  ) {
    logFirestoreQuery(`/users/${currentData.userId}`);
    const sender = await firestore.db
      .doc(`/users/${currentData.userId}`)
      .get();

    const payload = {
      notification: {
        title: sender.data().name || sender.data().email,
        body: '',
        click_action: notificationActionType.FLUTTER_CLICK,
      },
      data: {
        type: notificationType.NEW_LIKE,
        postId: context.params.postId,
        likeId: context.params.likeId,
        userId: currentData.userId,
      },
    };

    const notificationBody = prepareNotificationBody(
      currentData.userId,
      postAuthorId,
      notificationTitle.NEW_LIKE,
      `${sender.data().name} liked on your feed`,
      payload.data,
    );

    const { shouldBeNotified, userEntity } = await factory.getNotificationService()
      .checkForNotificationSending(postAuthorId);

    if (shouldBeNotified && userEntity?.notifToken) {
      logger.info(`Preparing to send initial like notification to user: ${postAuthorId}`);
      await factory.getNotificationService().sendAndSyncNotification(
        userEntity.notifToken,
        payload,
        notificationBody,
      );
    }
    scheduleNotificationBody.isScheduledForLikeNotification = false;
    scheduleNotificationBody.lastLikeNotificationSentOn = new Date();
  }

  await factory.getPostNotificationDetailService()
    .createOrUpdatePostNotificationDetail({
      externalPostId: context.params.postId,
      ...scheduleNotificationBody,
    });
};

export default summarizeAndNotifyOnLikeCreateHandler;
