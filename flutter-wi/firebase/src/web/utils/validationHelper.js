import ValidationError from './validationError';

export default {
  async validate(objToValidate, schema) {
    const valObj = objToValidate === null || objToValidate === undefined ? {} : objToValidate;
    const validationResult = schema.validate(valObj, { abortEarly: false, language: { key: '{{!key}} ' } });
    if (validationResult.error) {
      const res = validationResult.error
        .details.map((item) => ({ message: item.message, key: item.path }));
      throw new ValidationError(res);
    }
  },
  async validateSingleValue(value, schema, key) {
    const validationResult = schema.validate(value);
    if (validationResult.error) {
      const res = validationResult.error.details.map((item) => ({ message: item.message, key: key || '' }));
      throw new ValidationError(res);
    }
  },
};
