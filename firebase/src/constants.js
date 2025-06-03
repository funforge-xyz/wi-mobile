const notificationActionType = {
  FLUTTER_CLICK: 'FLUTTER_NOTIFICATION_CLICK',
};

const notificationType = {
  NEW_MESSAGE: 'new_message',
  NEW_COMMENT: 'new_comment',
  NEW_LIKE: 'new_like',
  COMMENTS_SUMMARY: 'comments_summary',
  LIKES_SUMMARY: 'likes_summary',
  INACTIVE_USER: 'inactive_user_notification',
  UPDATE_LOCATION_TRIGGER: 'trigger_update_location',
};

const postsPageSizeConfig = {
  NEARBY_AREA_FEEDS: 100,
  WIDER_AREA_FEEDS: 100,
  MOST_ENGAGED_FEEDS: 100,
  SPOSORED_FEEDS: 100,
};

const notificationTitle = {
  NEW_COMMENT: 'New Comment',
  NEW_LIKE: 'New Like',
  COMMENTS_SUMMARY: 'Comments Summary',
  LIKES_SUMMARY: 'Likes Summary',
  INACTIVITY_NOTIFICATION: 'Inactivity Notification',
};

const documentType = {
  POST: 'posts',
  LIKE: 'likes',
  COMMENT: 'comments',
  USER: 'users',
  NOTIF_TOKEN: 'notifTokens',
  USER_SETTINGS: 'settings',
  NOTIFICATION: 'notifications',
};

const syncAction = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
};

const notificationTypeIndex = {
  INITIAL_COMMENT: 1,
  INITIAL_LIKE: 2,
  SUMMARY_COMMENT: 3,
  SUMMARY_LIKE: 4,
  USER_INACTIVITY: 5,
};

const SILENT_LOCATION_UPDATE_TOPIC = 'all';

const INACTIVE_NOTIFICATION_BODY = 'Check what is happening around you!';

export {
  notificationActionType,
  notificationType,
  notificationTitle,
  postsPageSizeConfig,
  documentType,
  syncAction,
  notificationTypeIndex,
  SILENT_LOCATION_UPDATE_TOPIC,
  INACTIVE_NOTIFICATION_BODY,
};
