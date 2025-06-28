import { firestore } from 'firebase-admin';

const fs = firestore();
fs.settings({ ignoreUndefinedProperties: true });

// Eventually provide additional firestore configuration.
export default {
  db: fs,
  ref: firestore,
};
