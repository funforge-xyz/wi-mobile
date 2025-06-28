import { logger } from 'firebase-functions';
import { documentType, syncAction } from '../../constants';
import ServiceFactory from '../../web/services/serviceFactory';
import { registerFailedSync } from '../../helpers/failedSyncRegistration';

const determineActionType = (change) => {
  if (change.after.exists) return syncAction.DELETE;
  if (change.before.exits) return syncAction.CREATE;
  return syncAction.UPDATE;
};

const onWriteUserSettingsHandler = async (change, context) => {
  logger.info(
    `Syncing user settings in DB for document: ${context.params.userId}`,
  );

  const { userId } = context.params;
  const { after: afterSettings, before: beforeSettings } = change;
  const settingsBody = {};

  if (
    afterSettings.data()?.notifications?.notifyMe !== beforeSettings.data()?.notifications?.notifyMe
    && afterSettings.data()?.notifications?.notifyMe !== undefined) {
    settingsBody.notifyMe = afterSettings.data().notifications.notifyMe;
  }

  const actionType = determineActionType(change);

  try {
    const factory = new ServiceFactory('rdb', context);
    if (afterSettings.data()?.tzSettings?.tzOffset !== undefined
      && afterSettings.data()?.tzSettings?.tzAbbrev !== undefined
      && (afterSettings.data()?.tzSettings?.tzAbbrev !== beforeSettings.data()?.tzSettings?.tzAbbrev
      || afterSettings.data()?.tzSettings?.tzOffset !== beforeSettings.data()?.tzSettings?.tzOffset)
    ) {
      const { tzAbbrev, tzOffset } = change.after.data().tzSettings;
      const timezone = await factory.getTimezoneService()
        .prepareUserTimezone(tzAbbrev, tzOffset);
      if (timezone && timezone.timezone) {
        settingsBody.timezone = timezone.timezone;
      }
    }

    if (Object.keys(settingsBody).length > 0) {
      await factory.getUserService().updateUserByExternalId(userId, settingsBody);
    }
  } catch (ex) {
    logger.error('An error occured while syncing users in db:', ex);
    await registerFailedSync(
      actionType,
      documentType.USER_SETTINGS,
      userId,
      settingsBody,
    );
  }
};

export default onWriteUserSettingsHandler;
