/* eslint-disable class-methods-use-this */
import { logger } from 'firebase-functions';
import { messaging } from 'firebase-admin';
import {
  notificationType,
  notificationActionType,
  notificationTypeIndex,
  notificationTitle,
  INACTIVE_NOTIFICATION_BODY,
} from '../../../constants';
import validations from './validations/notificationServiceValidation';
import ValidationError from '../../utils/validationError';

const cleanupTokens = (response, tokens, tokenRefs) => {
  const tokensDelete = [];
  response.results.forEach((result, index) => {
    const { error } = result;
    if (error) {
      logger.error(error);
      logger.error(`Failure sending notification to: ${tokens[index]}`);
      if (error.code === 'messaging/invalid-registration-token'
        || error.code === 'messaging/registration-token-not-registered') {
        tokensDelete.push(tokenRefs[tokens[index]].ref.delete());
      }
    }
  });
  return Promise.all(tokensDelete);
};


class NotificationService {
  constructor(options) {
    this.firestore = options.firestore;
    this.firestoreRef = options.firestoreRef;
    this.context = options.context;
    this.factory = options.factory;
    this.repository = options.repository;
  }

  async createNotificationEntity(notificationData, userId = null) {
    logger.info(`Create notification with data ${JSON.stringify(notificationData)}.`);
    await validations.createNotificationEntity(notificationData);
    let targetUserId = userId;

    if (!targetUserId) {
      const targetUser = await this.factory.getUserService().getUserByExternalId(
        notificationData.targetUserExternalId,
      );

      if (!targetUser) {
        throw new ValidationError('Target user does not exist.');
      }

      targetUserId = targetUser.id;
    }

    const result = await this.repository.insert({
      ...notificationData,
      targetUserId,
    });

    return result;
  }

  async updateNotificationEntity(externalNotificationId, notificationData) {
    logger.info(`Update notification ${externalNotificationId}, data: ${JSON.stringify(notificationData)}.`);
    await validations.updateNotificationEntity(externalNotificationId, notificationData);

    const result = await this.repository.update({ externalNotificationId }, notificationData);

    return result;
  }

  async checkForNotificationSendingFs(userId) {
    // Firestore version of notify me checker.
    const userData = await this.factory.getUserService().getUserByExternalId(userId);

    if (!userData) {
      return false;
    }

    return userData.notifyMe;
  }

  async sendNotificationFs(userNotifTokens, payload, options = null) {
    await validations.sendNotificationToUsers(payload);

    if (userNotifTokens.empty) {
      return;
    }

    const tokens = [];
    const tokenRefs = {};

    userNotifTokens.forEach((notifToken) => {
      const { token } = notifToken.data();
      tokens.push(token);
      tokenRefs[token] = notifToken;
    });

    if (tokens.length > 0) {
      const opt = options || {};
      const response = await messaging().sendToDevice(tokens, payload, opt);
      await cleanupTokens(response, tokens, tokenRefs);
    }
  }

  async checkForNotificationSending(userId) {
    // NOTE: If user settings does not exist, return true.
    const userData = await this.factory.getUserService().getUserByExternalId(userId);
    let shouldBeNotified = true;

    if (!userData) {
      shouldBeNotified = false;
    }

    return {
      shouldBeNotified,
      userEntity: shouldBeNotified ? userData : null,
    };
  }


  async sendNotification(userNotifToken, payload, options = null) {
    await validations.sendNotificationToUsers(payload);
    const opt = options || {};
    await messaging().sendToDevice(userNotifToken, payload, opt);
  }

  async syncNotification(notificationRef, notificationPayload) {
    logger.info('Sync notification record');
    const { data } = notificationPayload;
    data.notifRecordId = notificationRef.id;

    const body = {
      ...notificationPayload,
      data,
      createdAt: this.firestoreRef.Timestamp.now(),
      open: null,
      read: null,
    };

    try {
      await notificationRef.set(body);
    } catch (error) {
      logger.info(`An error occured while inserting notification: ${error}`);
    }

    return notificationRef.id;
  }

  async sendAndSyncNotification(userNotifToken, payload, syncPayload) {
    await validations.sendNotification(payload, syncPayload);
    const { data, notification } = payload;

    const notifRef = this.firestore.collection('notifications').doc();
    data.notifRecordId = notifRef.id;

    await this.syncNotification(notifRef, syncPayload);

    if (userNotifToken) {
      await this.sendNotification(userNotifToken, { data, notification });
    }
  }

  // Method to subscribe tokn on certain topic
  async subscribeUserTokenOnTopic(notifToken, topicName) {
    logger.info(`Subscribing token on the topic: ${topicName}`);
    try {
      const response = await messaging().subscribeToTopic(notifToken, topicName);
      console.log('Subscription response: ', response);
      if (response.failureCount > 0) {
        console.log('Following devices unsucessfully subscribed to topic:');
        response.errors.forEach((error) => {
          console.log(notifToken, error.error);
        });
      }
    } catch (err) {
      // Track failed subscriptions.
      logger.error('An error occured while subscribing to topic.', err);
    }
  }

  async unsubscribeUserTokenFromTopic(notifToken, topicName) {
    logger.info(`Unsubscribing user token from the topic: ${topicName}`);
    try {
      const response = await messaging().unsubscribeFromTopic(notifToken, topicName);
      if (response.failureCount > 0) {
        console.log('Following devices unsucessfully unsubscribed from the topic:');
        response.errors.forEach((error) => {
          console.log(notifToken, error.error);
        });
      }
    } catch (err) {
      // Track failed unsubscribe operations.
      logger.error('An error occured while unsubscribing to topic.', err);
    }
  }

  // Temporary only supports one type of notificaton
  async sendSilentNotificationToTopic(topicName) {
    logger.info(`Sending notification to topic: ${topicName}.`);
    const message = {
      topic: topicName,
      data: {
        type: notificationType.UPDATE_LOCATION_TRIGGER,
      },
      android: {
        priority: 'high',
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            contentAvailable: true,
          },
        },
      },
    };

    const responseId = await messaging().send(message);
    logger.info(`Message sent to topic: ${topicName}. MessageID: ${responseId}.`);
  }

  async sendInactiveUserNotification() {
    logger.info('Sending notification to inactive users');
    const users = await this.factory.getUserService().getInactiveUsersForNotification();
    const inactiveUsers = users.filter((user) => user.notifToken !== null);
    const notificationPromises = [];

    inactiveUsers.forEach((user) => {
      logger.info(`User id: ${user.id}. Name: ${user.name}`);
      const payload = {
        data: {
          type: notificationType.INACTIVE_USER,
        },
        notification: {
          title: 'Heeey!',
          body: INACTIVE_NOTIFICATION_BODY,
          click_action: notificationActionType.FLUTTER_CLICK,
        },
      };
      notificationPromises.push(this.sendNotification(user.notifToken, payload));
    });

    await Promise.all(notificationPromises);

    const notificationEntityPromises = inactiveUsers.map((user) => this.createNotificationEntity({
      title: notificationTitle.INACTIVITY_NOTIFICATION,
      body: INACTIVE_NOTIFICATION_BODY,
      targetUserExternalId: user.externalUserId,
      notificationTypeId: notificationTypeIndex.USER_INACTIVITY,
    }, user.id));

    await Promise.all(notificationEntityPromises);
  }
}

export default NotificationService;
