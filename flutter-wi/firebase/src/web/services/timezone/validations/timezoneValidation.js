import joi from 'joi';
import validationHelper from '../../../utils/validationHelper';

const validations = {
  prepareUserTimezone: async (tzAbbrev, tzOffset) => {
    await validationHelper.validateSingleValue(tzAbbrev, joi.string().required(), 'tzAbbreviation');
    await validationHelper.validateSingleValue(tzOffset, joi.string().required(), 'tzOffset');
  },
};

export default validations;
