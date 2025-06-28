import { logger } from 'firebase-functions';
import validations from './validations/timezoneValidation';

class TimezoneService {
  constructor(options) {
    this.repository = options.repository;
    this.context = options.context;
    this.factory = options.factory;
  }

  async prepareUserTimezone(tzAbbreviation, tzOffset) {
    logger.info(`Get timezone data for abbreviation: ${tzAbbreviation} and offset: ${tzOffset}`);
    await validations.prepareUserTimezone(tzAbbreviation, tzOffset);

    const tz = await this.repository.getPgTimezone(tzAbbreviation, tzOffset);

    return tz;
  }
}

export default TimezoneService;
