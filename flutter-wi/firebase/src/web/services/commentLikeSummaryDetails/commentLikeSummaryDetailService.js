/* eslint-disable no-await-in-loop */
import { logger } from 'firebase-functions';
import { prepareNotificationBody } from '../../../helpers/notificationSync';
import { notificationActionType, notificationType, notificationTitle } from '../../../constants';

const HOURS_LIMIT = 3; // Three hours

const getNotificationBody = (numOfComments, numOfLikes) => {
  let commentItem = '';
  let likeItem = '';
  let message = '';

  const determineVerb = (numOfItems) => (numOfItems > 1 ? 'are' : 'is');
  const determineType = (numOfItems, type) => (numOfItems > 1 ? `${type}s` : type);

  if (numOfComments > 0 && numOfLikes > 0) {
    commentItem = determineType(numOfComments, 'comment');
    likeItem = determineType(numOfLikes, 'like');
    message = `There ${determineVerb(numOfComments)} ${numOfComments} new ${commentItem} and ${numOfLikes} new ${likeItem} on your feed`;
  } else if (numOfComments > 0) {
    commentItem = determineType(numOfComments, 'comment');
    message = `There ${determineVerb(numOfComments)} ${numOfComments} new ${commentItem} on your feed`;
  } else if (numOfLikes > 0) {
    likeItem = determineType(numOfLikes, 'like');
    message = `There ${determineVerb(numOfComments)} ${numOfLikes} new ${likeItem} on your feed`;
  }

  return message;
};

const prepareNotificationPayload = (post) => ({
  notification: {
    title: 'New Activity on Your Feed',
    body: getNotificationBody(post.totalCommentsToNotify, post.totalLikesToNotify),
    click_action: notificationActionType.FLUTTER_CLICK,
  },
  data: {
    type: notificationType.COMMENTS_SUMMARY,
    postId: post.externalPostId,
    imageUrl: post.imageUrl || '',
  },
});

const setNotificationBody = (post, payload) => prepareNotificationBody(
  null,
  post.externalAuthorId,
  notificationTitle.LIKES_SUMMARY,
  getNotificationBody(post.totalCommentsToNotify, post.totalLikesToNotify),
  payload.data,
);


class CommentLikeSummaryDetailService {
  constructor(options) {
    this.repository = options.repository;
    this.context = options.context;
    this.factory = options.factory;
  }

  async getCommentLikeSummaryDetails() {
    logger.info('Fetch all comment and like summary details');

    const results = await this.repository.findMany({
      params: { include: ['User'] },
    });

    return results;
  }

  async sendCommentLikeSummaryNotifications() {
    logger.info('Send comment and like summary notifications');
    const results = await this.getCommentLikeSummaryDetails();

    const timeDiff = new Date();
    timeDiff.setHours(timeDiff.getHours() - HOURS_LIMIT);

    if (!results || results.totalCount === 0) return;

    const posts = results.resultList;
    const promises = [];

    for (let i = 0; i < results.totalCount; i += 1) {
      const payload = prepareNotificationPayload(posts[i]);
      const notificationBody = setNotificationBody(posts[i], payload);

      const { shouldBeNotified, userEntity } = await this.factory.getNotificationService()
        .checkForNotificationSending(posts[i].externalAuthorId);

      if (shouldBeNotified && userEntity?.notifToken && posts[i].user.lastTimeSeen >= timeDiff) {
        logger.info(`Preparing to send comment and like summary notification to user: ${posts[i].externalAuthorId}`);
        try {
          await this.factory.getNotificationService().sendAndSyncNotification(
            userEntity.notifToken,
            payload,
            notificationBody,
          );
        } catch (error) {
          logger.info('An error occurred when sending summary notification', error);
        }
      }

      const commentLikeDetail = {};
      const currentDate = new Date();

      if (posts[i].totalCommentsToNotify > 0) {
        commentLikeDetail.isScheduledForCommentNotification = false;
        commentLikeDetail.lastCommentNotificationSentOn = currentDate;
      }

      if (posts[i].totalLikesToNotify > 0) {
        commentLikeDetail.isScheduledForLikeNotification = false;
        commentLikeDetail.lastLikeNotificationSentOn = currentDate;
      }

      // Update last time sent and scheduled flag
      promises.push(this.factory.getPostNotificationDetailService().updatePostNotificationDetail(
        posts[i].id,
        commentLikeDetail,
      ));
    }
    await Promise.all(promises);
  }
}

export default CommentLikeSummaryDetailService;
