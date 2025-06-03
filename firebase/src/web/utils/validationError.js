class ValidationError extends Error {
  constructor(errors) {
    super('validation error');
    Error.captureStackTrace(this, this.constructor);
    this.name = 'ValidationError';
    this.errors = errors;
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }

  toJSON() {
    return {
      hasErrors: true,
      errors: this.errors,
    };
  }
}

export default ValidationError;
