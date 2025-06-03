/* eslint-disable no-await-in-loop */
import { logger } from 'firebase-functions';
import validations from './validations/userBlockValidation';
import ValidationError from '../../utils/validationError';
import { transactionAsync } from '../../utils/decorators';
import { checkLoggedUser } from '../../utils/auth';

class UserBlockService {
  constructor(options) {
    this.repository = options.repository;
    this.context = options.context;
    this.factory = options.factory;
    this.firestore = options.firestore;
    this.firestoreRef = options.firestoreRef;
  }

  async getBlockedUsers(externalUserId) {
    logger.info(`Fetch all blocked users for user: ${externalUserId}`);
    validations.getBlockedUsers(externalUserId);

    checkLoggedUser(this.context.user, externalUserId);

    const blockedUsersResults = await this.repository.findMany({
      search: [
        {
          prop: 'externalUserId',
          value: externalUserId,
          operator: '=',
        },
      ],
    });

    const blockedByUsersResults = await this.repository.findMany({
      search: [
        {
          prop: 'blockedUserExternalId',
          value: externalUserId,
          operator: '=',
        },
      ],
    });

    let blockedUserIds = [];
    let blockedByUserIds = [];

    if (blockedUsersResults?.resultList) {
      blockedUserIds = blockedUsersResults.resultList.map((item) => item.blockedUserExternalId);
    }

    if (blockedByUsersResults?.resultList) {
      blockedByUserIds = blockedByUsersResults.resultList.map((item) => item.externalUserId);
    }

    return { blockedUserIds, blockedByUserIds };
  }

  async getUserBlockEntry(externalUserId, blockedUserExternalId) {
    logger.info(`Get user block entry for user: ${externalUserId} blocked user: ${blockedUserExternalId}`);
    await validations.getUserBlockEntry(externalUserId, blockedUserExternalId);

    const userBlockEntry = await this.repository.findOne({
      search: [
        {
          prop: 'externalUserId',
          value: externalUserId,
          operator: '=',
        },
        {
          prop: 'blockedUserExternalId',
          value: blockedUserExternalId,
          operator: '=',
        },
      ],
    });

    return userBlockEntry;
  }

  @transactionAsync()
  async blockUser(externalUserId, blockedUserExternalId) {
    logger.info(`Created block from user: ${externalUserId} to user: ${blockedUserExternalId}`);
    await validations.blockUser(externalUserId, blockedUserExternalId);

    checkLoggedUser(this.context.user, externalUserId);

    if (externalUserId === blockedUserExternalId) {
      throw new ValidationError('Wrong external user id.');
    }

    const userBlock = await this.getUserBlockEntry(externalUserId, blockedUserExternalId);
    if (userBlock) {
      throw new ValidationError('User block already exists.');
    }

    await this.repository.insert({
      externalUserId,
      blockedUserExternalId,
    });

    const { Timestamp: timestamp } = this.firestoreRef;

    await this.firestore
      .collection(`users/${externalUserId}/blockedUsers`)
      .doc(blockedUserExternalId)
      .set({ createdAt: timestamp.now() });
  }

  @transactionAsync()
  async unblockUser(externalUserId, blockedUserExternalId) {
    logger.info(`Delete block from user: ${externalUserId} to user: ${blockedUserExternalId}`);
    await validations.unblockUser(externalUserId, blockedUserExternalId);
    const userBlock = await this.getUserBlockEntry(externalUserId, blockedUserExternalId);

    checkLoggedUser(this.context.user, externalUserId);

    if (externalUserId === blockedUserExternalId) {
      throw new ValidationError('Wrong external user id.');
    }

    if (userBlock === null) {
      throw new ValidationError('User block does not exist.');
    }

    await this.repository.delete({
      search: [
        {
          prop: 'externalUserId',
          value: externalUserId,
          operator: '=',
        },
        {
          prop: 'blockedUserExternalId',
          value: blockedUserExternalId,
          operator: '=',
        },
      ],
    });

    await this.firestore
      .collection(`users/${externalUserId}/blockedUsers`)
      .doc(blockedUserExternalId)
      .delete();
  }
}

export default UserBlockService;
