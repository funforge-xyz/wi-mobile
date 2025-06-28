import * as functions from 'firebase-functions';
// import failedDbSyncHandler from './failedDbSyncScheduler';
import commentAndLikeNotificationHandler from './commentAndLikeNotificationScheduler';
import silentNotificationHandler from './silentNotificationScheduler';
import inactiveUserNotificationHandler from './inactiveUserNotificationScheduler';


const commentAndLikeNotificationFunction = functions.region('europe-west1')
  .pubsub.schedule('every 3 hours')
  .onRun(commentAndLikeNotificationHandler);

const silentNotificationFunction = functions.region('europe-west1')
  .pubsub.schedule('every 15 minutes')
  .onRun(silentNotificationHandler);

const inactiveNoonNotificationFunction = functions.region('europe-west1')
  .pubsub.schedule('55 11 * * *').timeZone('Europe/Sarajevo')
  .onRun(inactiveUserNotificationHandler);

// NOTE: Difference between these functions should reflect in the DB function for inactive users
const inactiveAfternoonNotificationFunction = functions.region('europe-west1')
  .pubsub.schedule('05 17 * * *').timeZone('Europe/Sarajevo')
  .onRun(inactiveUserNotificationHandler);

// const failedDbSyncFunction = functions.region('europe-west1')
//   .pubsub.schedule('every 2 hours')
//   .onRun(failedDbSyncHandler);

export default {
  // failedDbSyncFunction,
  commentAndLikeNotificationFunction,
  silentNotificationFunction,
  inactiveNoonNotificationFunction,
  inactiveAfternoonNotificationFunction,
};
