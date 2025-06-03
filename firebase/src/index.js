import { logger } from 'firebase-functions';
import app from './main';
import commentsHandler from './functions/commentHandlers';
import likesHandler from './functions/likeHandlers';
import postsHandler from './functions/postHandlers';
import messagesHandler from './functions/messageHandlers';
import usersHandler from './functions/userHandlers';
import notificationHandler from './functions/notificationHandlers';
import httpHandler from './functions/httpHandlers';
import scheduleFunctions from './functions/scheduleFunctions';

logger.info('Initialized app: ', app.name);

export const onNewMessage = messagesHandler.onNewMessageFunction;

export const syncOnPostCreate = postsHandler.syncOnPostCreateFunction;
export const syncOnPostDelete = postsHandler.syncOnPostDeleteFunction;

export const summarizeAndNotifyOnCommentCreate = (
  commentsHandler.summarizeAndNotifyOnCommentCreateFunction
);
export const syncOnCommentDelete = commentsHandler.commentsOnDeleteFunction;
export const syncOnCommentReplyWrite = commentsHandler.commentReplyOnWriteFunction;

export const summarizeAndNotifyOnLikeCreate = likesHandler.summarizeAndNotifyOnLikeCreateFunction;
export const syncOnLikesDelete = likesHandler.likesOnDeleteFunction;

export const syncOnUserCreate = usersHandler.onCreateUserFunction;
export const syncOnUserUpdate = usersHandler.onUpdateUserFunction;
export const syncOnUserNotifTokenCreate = usersHandler.onUserNotifTokenCreateFunction;
export const syncOnUserSettingsUpdate = usersHandler.onWriteUserSettingsFunction;

export const syncOnNotificationCreate = notificationHandler.syncOnNotificationCreateFunction;
export const syncOnNotificationUpdate = notificationHandler.syncOnNotificationUpdateFunction;

export const restApiFunction = httpHandler.httpApiFunction;

export const commentAndLikeNotificationScheduler = (
  scheduleFunctions.commentAndLikeNotificationFunction
);
export const silentNotificationScheduler = (
  scheduleFunctions.silentNotificationFunction
);
export const inactiveNoonNotificationScheduler = (
  scheduleFunctions.inactiveNoonNotificationFunction
);
export const inactiveAfternoonNotificationScheduler = (
  scheduleFunctions.inactiveAfternoonNotificationFunction
);
// export const failedDbSyncScheduler = failedBySyncFunction;
