import * as functions from 'firebase-functions';
import cfg from './config.json';

const projectId = process.env.GCLOUD_PROJECT;
let env = process.env.NODE_ENV || 'dev';

// NOTE: Temporarely added until we introduce CI/CD.
if (env === 'production' || projectId === 'wichat-2684e') {
  env = 'test';
}
const config = cfg[env];
config.env = env;

if (env !== 'dev') {
 config.pgpassword = functions.config().db.pgpassword;
}

export default {
  ...config
};
