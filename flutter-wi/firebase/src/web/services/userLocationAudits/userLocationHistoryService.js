import { logger } from 'firebase-functions';
import validations from './validations/userLocationHistoryValidation';

class UserLocationHistoryService {
  constructor(options) {
    this.repository = options.repository;
    this.context = options.context;
    this.factory = options.factory;
  }

  async getUserLocationAudits(searchObj) {
    logger.info(`Get user locations: ${searchObj}`);
    await validations.getUserLocationAudits(searchObj);

    const results = await this.repository.find(searchObj);
    return results;
  }

  async createUserLocationHistory(locationHistoryObj) {
    await validations.createUserLocationHistory(locationHistoryObj);
    const userLocationHistory = await this.repository.insert(locationHistoryObj);

    return userLocationHistory;
  }
}

export default UserLocationHistoryService;
