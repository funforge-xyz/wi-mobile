/* eslint-disable func-names */
const transactionAsync = () => function decorator(target, name, descriptor) {
  const desc = descriptor;
  const original = descriptor.value;
  if (typeof original === 'function') {
    desc.value = function (...args) {
      return Promise.resolve(
        this.repository.useTransaction(() => Promise.resolve(original.apply(this, args))),
      );
    };
  }
  return desc;
};

// eslint-disable-next-line import/prefer-default-export
export { transactionAsync };
