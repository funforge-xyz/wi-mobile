// Should be used to simplify the notifications.
const parse = (str, ...args) => {
  let i = 0;
  return str.replace(/%s/g, () => { const arg = args[i]; i += 1; return arg; });
};

export default parse;
