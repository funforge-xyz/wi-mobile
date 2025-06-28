import joi from 'joi';
import validationHelper from '../../../utils/validationHelper';

const validations = {
  getBlockedUsers: async (externalUserId) => {
    await validationHelper.validateSingleValue(externalUserId, joi.string().required(), 'externalUserId');
  },
  getUserBlockEntry: async (externalUserId, blockedExternalUserId) => {
    await validationHelper.validateSingleValue(externalUserId, joi.string().required(), 'externalUserId');
    await validationHelper.validateSingleValue(
      blockedExternalUserId,
      joi.string().required(),
      'blockedExternalUserId',
    );
  },
  blockUser: async (externalUserId, blockedExternalUserId) => {
    await validationHelper.validateSingleValue(externalUserId, joi.string().required(), 'externalUserId');
    await validationHelper.validateSingleValue(
      blockedExternalUserId,
      joi.string().required(),
      'blockedExternalUserId',
    );
  },
  unblockUser: async (externalUserId, blockedExternalUserId) => {
    await validationHelper.validateSingleValue(externalUserId, joi.string().required(), 'externalUserId');
    await validationHelper.validateSingleValue(
      blockedExternalUserId,
      joi.string().required(),
      'blockedExternalUserId',
    );
  },
};

export default validations;
