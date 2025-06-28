import schema from './userLocationHistorySchema';
import validationHelper from '../../../utils/validationHelper';

const validations = {
  createUserLocationHistory: async (insertRequest) => {
    await validationHelper.validate(insertRequest, schema.createUserLocationHistory);
  },
  getUserLocationAudits: async (searchObj) => {
    await validationHelper.validate(searchObj, schema.getUserLocationAudits);
  },
};

export default validations;
